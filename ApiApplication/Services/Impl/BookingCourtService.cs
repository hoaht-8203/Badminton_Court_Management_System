using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.BookingCourt;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class BookingCourtService(
    ApplicationDbContext context,
    IMapper mapper,
    IPaymentService paymentService,
    IConfiguration configuration
) : IBookingCourtService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly IPaymentService _paymentService = paymentService;
    private readonly IConfiguration _configuration = configuration;

    public async Task<DetailBookingCourtResponse> CreateBookingCourtAsync(
        CreateBookingCourtRequest request
    )
    {
        // Validate & normalize DayOfWeek: Monday=2 ... Sunday=8
        if (request.StartTime >= request.EndTime)
        {
            throw new ApiException(
                "Giờ bắt đầu phải nhỏ hơn giờ kết thúc.",
                HttpStatusCode.BadRequest
            );
        }

        // Không cho đặt các ngày đã qua
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (request.EndDate < today)
        {
            throw new ApiException("Không thể đặt cho ngày đã qua.", HttpStatusCode.BadRequest);
        }
        if (request.StartDate < today)
        {
            throw new ApiException(
                "Ngày bắt đầu phải từ hôm nay trở đi.",
                HttpStatusCode.BadRequest
            );
        }

        if (request.DaysOfWeek == null)
        {
            if (request.StartDate != request.EndDate)
            {
                throw new ApiException(
                    "Booking vãng lai phải có StartDate = EndDate và DayOfWeek = null.",
                    HttpStatusCode.BadRequest
                );
            }
            // set as empty for consistency with entity schema
            request.DaysOfWeek = Array.Empty<int>();
        }
        else
        {
            var normalized = request
                .DaysOfWeek.Where(d => d >= 2 && d <= 8)
                .Distinct()
                .OrderBy(d => d)
                .ToArray();
            if (normalized.Length == 0)
            {
                throw new ApiException(
                    "Các ngày trong tuần phải nằm trong khoảng 2..8 (T2..CN).",
                    HttpStatusCode.BadRequest
                );
            }
            request.DaysOfWeek = normalized;
            if (request.StartDate > request.EndDate)
            {
                throw new ApiException(
                    "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.",
                    HttpStatusCode.BadRequest
                );
            }
        }

        // Kiểm tra cấu hình giá/khung giờ: nếu sân chưa cấu hình cho khoảng giờ đặt → chặn
        await EnsurePricingConfiguredForRequestAsync(request);

        var query = _context.BookingCourts.Where(b => b.CourtId == request.CourtId);

        // Thời gian giao nhau theo ngày: khoảng [StartDate..EndDate]
        query = query.Where(b => b.StartDate <= request.EndDate && request.StartDate <= b.EndDate);

        // Check theo giờ (ca): overlap nếu [StartTime..EndTime] giao nhau
        query = query.Where(b => b.StartTime < request.EndTime && request.StartTime < b.EndTime);

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

        // Exclude expired holds: treat as free if PendingPayment older than HoldMinutes
        var holdMinutes = _configuration.GetValue<int?>("Booking:HoldMinutes");
        var nowUtc = DateTime.UtcNow;

        var exists = await query.AnyAsync(b =>
            b.Status != Entities.Shared.BookingCourtStatus.PendingPayment
            || (
                // If explicit expiry exists, require it to be in the future to block
                (b.HoldExpiresAtUtc != null && b.HoldExpiresAtUtc > nowUtc)
                // Otherwise fallback to CreatedAt + HoldMinutes
                || (
                    b.HoldExpiresAtUtc == null
                    && (
                        holdMinutes == null
                            ? true
                            : b.CreatedAt > nowUtc.AddMinutes(-holdMinutes.Value)
                    )
                )
            )
        );
        if (exists)
        {
            throw new ApiException(
                "Khoảng thời gian/sân đã được đặt trước, vui lòng chọn thời gian khác.",
                HttpStatusCode.BadRequest
            );
        }

        var entity = _mapper.Map<BookingCourt>(request);
        entity.DaysOfWeek = reqDaysArr;
        // For receptionist flow, create booking as PendingPayment until SePay confirms
        entity.Status = BookingCourtStatus.PendingPayment;
        var holdMins = _configuration.GetValue<int?>("Booking:HoldMinutes") ?? 15;
        entity.HoldExpiresAtUtc = DateTime.UtcNow.AddMinutes(holdMins);

        await _context.BookingCourts.AddAsync(entity);
        await _context.SaveChangesAsync();

        // Tạo payment pending ngay sau khi tạo booking
        await _paymentService.CreatePaymentAsync(
            new Dtos.Payment.CreatePaymentRequest { BookingId = entity.Id }
        );

        // Note: email sending with payment link handled in higher layer (e.g., BookingCourtsController)

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
        var days =
            (request.DaysOfWeek == null || request.DaysOfWeek.Length == 0)
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

    public async Task<List<ListBookingCourtResponse>> ListBookingCourtsAsync(
        ListBookingCourtRequest request
    )
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

        var items = await query
            .OrderByDescending(x => x.StartDate)
            .ThenBy(x => x.StartTime)
            .ToListAsync();
        return _mapper.Map<List<ListBookingCourtResponse>>(items);
    }
}
