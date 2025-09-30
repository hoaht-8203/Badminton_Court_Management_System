using ApiApplication.Data;
using ApiApplication.Dtos.BookingCourt;
using ApiApplication.Entities;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ApiApplication.Services;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using System.Net;
using ApiApplication.Dtos.Invoice;

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
            throw new ApiException("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.", HttpStatusCode.BadRequest);
        }

        // Không cho đặt các ngày đã qua
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (request.EndDate < today)
        {
            throw new ApiException("Không thể đặt cho ngày đã qua.", HttpStatusCode.BadRequest);
        }
        if (request.StartDate < today)
        {
            throw new ApiException("Ngày bắt đầu phải từ hôm nay trở đi.", HttpStatusCode.BadRequest);
        }

        if (request.DaysOfWeek == null)
        {
            if (request.StartDate != request.EndDate)
            {
                throw new ApiException("Booking vãng lai phải có StartDate = EndDate và DayOfWeek = null.", HttpStatusCode.BadRequest);
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
                throw new ApiException("DayOfWeek phải nằm trong khoảng 2..8 (T2..CN).", HttpStatusCode.BadRequest);
            }
            request.DaysOfWeek = normalized;
            if (request.StartDate > request.EndDate)
            {
                throw new ApiException("StartDate phải nhỏ hơn hoặc bằng EndDate.", HttpStatusCode.BadRequest);
            }
        }

        // Kiểm tra cấu hình giá/khung giờ: nếu sân chưa cấu hình cho khoảng giờ đặt → chặn
        await EnsurePricingConfiguredForRequestAsync(request);

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
			throw new ApiException("Khoảng thời gian/sân đã được đặt trước, vui lòng chọn thời gian khác.", HttpStatusCode.BadRequest);
		}

        var entity = _mapper.Map<BookingCourt>(request);
        entity.DaysOfWeek = reqDaysArr;
        entity.Status = BookingCourtStatus.Active;

		await _context.BookingCourts.AddAsync(entity);
        await _context.SaveChangesAsync();

        // Tạo hóa đơn pending ngay sau khi tạo booking
        await _invoiceService.CreateInvocieAsync(new CreateInvoiceRequest { BookingId = entity.Id });

        return _mapper.Map<DetailBookingCourtResponse>(entity);
	}

    private static int GetCustomDayOfWeek(DateOnly date)
    {
        var sys = (int)date.DayOfWeek; // Sunday=0..Saturday=6
        return sys == 0 ? 8 : sys + 1; // Monday=2..Sunday=8
    }

    private async Task EnsurePricingConfiguredForRequestAsync(CreateBookingCourtRequest request)
    {
        var start = request.StartTime;
        var end = request.EndTime;
        var days = (request.DaysOfWeek == null || request.DaysOfWeek.Length == 0)
            ? new int[] { GetCustomDayOfWeek(request.StartDate) }
            : request.DaysOfWeek;

        foreach (var dow in days)
        {
            var covered = await _context.CourtPricingRules.AnyAsync(r =>
                r.CourtId == request.CourtId
                && r.DaysOfWeek.Contains(dow)
                && r.StartTime <= start
                && r.EndTime >= end
            );
            if (!covered)
            {
                throw new ApiException(
                    $"Sân này chưa được cấu hình giá theo khung giờ {start:HH\\:mm}-{end:HH\\:mm}.",
                    HttpStatusCode.BadRequest
                );
            }
        }
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


