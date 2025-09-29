using ApiApplication.Data;
using ApiApplication.Dtos.BookingCourt;
using ApiApplication.Entities;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ApiApplication.Services;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Services.Impl;

public class BookingCourtService(ApplicationDbContext context, IMapper mapper, IInvoiceService invoiceService) : IBookingCourtService
{
	private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly IInvoiceService _invoiceService = invoiceService;

    public async Task<DetailBookingCourtResponse> CreateBookingCourtAsync(CreateBookingCourtRequest request)
	{
        // Validate & normalize DayOfWeek: Monday=2 ... Sunday=8
        if (request.StartTime >= request.EndTime)
        {
            throw new InvalidOperationException("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
        }

        // Không cho đặt các ngày đã qua
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (request.EndDate < today)
        {
            throw new InvalidOperationException("Không thể đặt cho ngày đã qua.");
        }
        if (request.StartDate < today)
        {
            throw new InvalidOperationException("Ngày bắt đầu phải từ hôm nay trở đi.");
        }

        if (request.DaysOfWeek == null)
        {
            if (request.StartDate != request.EndDate)
            {
                throw new InvalidOperationException("Booking vãng lai phải có StartDate = EndDate và DayOfWeek = null.");
            }
            // set as empty for consistency with entity schema
            request.DaysOfWeek = Array.Empty<int>();
        }
        else
        {
            var normalized = request.DaysOfWeek
                .Where(d => d >= 2 && d <= 8)
                .Distinct()
                .OrderBy(d => d)
                .ToArray();
            if (normalized.Length == 0)
            {
                throw new InvalidOperationException("DayOfWeek phải nằm trong khoảng 2..8 (T2..CN).");
            }
            request.DaysOfWeek = normalized;
            if (request.StartDate > request.EndDate)
            {
                throw new InvalidOperationException("StartDate phải nhỏ hơn hoặc bằng EndDate.");
            }
        }

        var query = _context.BookingCourts
			.Where(b => b.CourtId == request.CourtId);

		// Thời gian giao nhau theo ngày: khoảng [StartDate..EndDate]
		query = query.Where(b =>
			b.StartDate <= request.EndDate && request.StartDate <= b.EndDate);

		// Check theo giờ (ca): overlap nếu [StartTime..EndTime] giao nhau
		query = query.Where(b =>
			b.StartTime < request.EndTime && request.StartTime < b.EndTime);

		// Phân biệt vãng lai và cố định
        // So ngày trong tuần theo schema mới: entity lưu DaysOfWeek (mảng rỗng = vãng lai)
        var reqDaysArr = request.DaysOfWeek ?? Array.Empty<int>();
        if (reqDaysArr.Length == 0)
        {
            // Vãng lai: so sánh thứ của ngày đặt với DaysOfWeek của booking cố định
            var reqDow = GetCustomDayOfWeek(request.StartDate);
            query = query.Where(b =>
                (b.DaysOfWeek == null || b.DaysOfWeek.Length == 0)
                || (b.DaysOfWeek != null && b.DaysOfWeek.Contains(reqDow))
            );
        }
        else
        {
            // Cố định: chặn nếu có bất kỳ thứ trùng nhau
            query = query.Where(b =>
                (b.DaysOfWeek == null || b.DaysOfWeek.Length == 0)
                || b.DaysOfWeek.Any(d => reqDaysArr.Contains(d))
            );
        }

        var exists = await query.AnyAsync();
		if (exists)
		{
			throw new InvalidOperationException("Khoảng thời gian/sân đã được đặt trước, vui lòng chọn thời gian khác.");
		}

        var entity = _mapper.Map<BookingCourt>(request);
        entity.DaysOfWeek = reqDaysArr;
        entity.Status = BookingCourtStatus.Active;

		await _context.BookingCourts.AddAsync(entity);
        await _context.SaveChangesAsync();

        // Tạo hóa đơn pending ngay sau khi tạo booking
        await _invoiceService.CreateInvocieAsync(entity.Id);

        return _mapper.Map<DetailBookingCourtResponse>(entity);
	}

    private static int GetCustomDayOfWeek(DateOnly date)
    {
        var sys = (int)date.DayOfWeek; // Sunday=0..Saturday=6
        return sys == 0 ? 8 : sys + 1; // Monday=2..Sunday=8
    }

    public async Task<List<ListBookingCourtResponse>> ListBookingCourtsAsync(ListBookingCourtRequest request)
    {
        var query = _context.BookingCourts.AsQueryable();

        if (request.CustomerId.HasValue)
        {
            query = query.Where(x => x.CustomerId == request.CustomerId.Value);
        }
        if (request.CourtId.HasValue)
        {
            query = query.Where(x => x.CourtId == request.CourtId.Value);
        }
        if (request.FromDate.HasValue)
        {
            query = query.Where(x => x.EndDate >= request.FromDate.Value);
        }
        if (request.ToDate.HasValue)
        {
            query = query.Where(x => x.StartDate <= request.ToDate.Value);
        }

        var items = await query.OrderByDescending(x => x.StartDate).ThenBy(x => x.StartTime).ToListAsync();
        return _mapper.Map<List<ListBookingCourtResponse>>(items);
    }
}


