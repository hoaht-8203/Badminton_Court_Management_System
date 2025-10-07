using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.BookingCourt;
using ApiApplication.Dtos.Payment;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.SignalR;
using AutoMapper;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class BookingCourtService(
    ApplicationDbContext context,
    IMapper mapper,
    IPaymentService paymentService,
    IConfiguration configuration,
    IHubContext<BookingHub> hub
) : IBookingCourtService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly IPaymentService _paymentService = paymentService;
    private readonly IConfiguration _configuration = configuration;
    private readonly IHubContext<BookingHub> _hub = hub;

    public async Task<DetailBookingCourtResponse> CreateBookingCourtAsync(
        CreateBookingCourtRequest request
    )
    {
        var startDate = DateOnly.FromDateTime(request.StartDate);
        var endDate = DateOnly.FromDateTime(request.EndDate);

        // Validate & normalize DayOfWeek: Monday=2 ... Sunday=8
        if (request.StartTime >= request.EndTime)
        {
            throw new ApiException(
                "Giờ bắt đầu phải nhỏ hơn giờ kết thúc.",
                HttpStatusCode.BadRequest
            );
        }

        // Không cho đặt các ngày đã qua
        var nowUtc = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(nowUtc);
        if (endDate < today)
        {
            throw new ApiException("Không thể đặt cho ngày đã qua.", HttpStatusCode.BadRequest);
        }
        if (startDate < today)
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

            // Chặn đặt giờ đã qua trong ngày hôm nay (vãng lai)
            if (startDate == today)
            {
                var nowTime = TimeOnly.FromDateTime(nowUtc);
                if (request.StartTime <= nowTime)
                {
                    throw new ApiException(
                        "Giờ bắt đầu phải lớn hơn thời điểm hiện tại.",
                        HttpStatusCode.BadRequest
                    );
                }
            }
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
            if (startDate > endDate)
            {
                throw new ApiException(
                    "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.",
                    HttpStatusCode.BadRequest
                );
            }

            // Chặn đặt giờ đã qua cho lần xuất hiện đầu tiên (cố định)
            // Tìm ngày áp dụng đầu tiên trong khoảng
            var firstApplicable = startDate;
            while (firstApplicable <= endDate)
            {
                var dow = GetCustomDayOfWeek(firstApplicable);
                if (request.DaysOfWeek.Contains(dow))
                {
                    break;
                }
                firstApplicable = firstApplicable.AddDays(1);
            }

            if (firstApplicable == today)
            {
                var nowTime = TimeOnly.FromDateTime(nowUtc);
                if (request.StartTime <= nowTime)
                {
                    throw new ApiException(
                        "Khung giờ hôm nay đã qua, vui lòng chọn giờ hợp lệ hoặc dời ngày bắt đầu.",
                        HttpStatusCode.BadRequest
                    );
                }
            }
        }

        var court =
            await _context.Courts.FirstOrDefaultAsync(c => c.Id == request.CourtId)
            ?? throw new ApiException("Sân này không tồn tại.", HttpStatusCode.BadRequest);
        if (court.Status == CourtStatus.Inactive)
        {
            throw new ApiException("Sân này không khả dụng.", HttpStatusCode.BadRequest);
        }
        if (court.Status == CourtStatus.Maintenance)
        {
            throw new ApiException("Sân này đang được bảo trì.", HttpStatusCode.BadRequest);
        }

        // Kiểm tra cấu hình giá/khung giờ: nếu sân chưa cấu hình cho khoảng giờ đặt → chặn
        await EnsurePricingConfiguredForRequestAsync(request);

        var query = _context.BookingCourts.Where(b => b.CourtId == request.CourtId);

        // Thời gian giao nhau theo ngày: khoảng [StartDate..EndDate]
        query = query.Where(b => b.StartDate <= endDate && startDate <= b.EndDate);

        // Check theo giờ (ca): overlap nếu [StartTime..EndTime] giao nhau
        query = query.Where(b => b.StartTime < request.EndTime && request.StartTime < b.EndTime);

        // Phân biệt vãng lai và cố định
        // So ngày trong tuần theo schema mới: entity lưu DaysOfWeek (mảng rỗng = vãng lai)
        var reqDaysArr = request.DaysOfWeek ?? Array.Empty<int>();
        if (reqDaysArr.Length == 0)
        {
            // Vãng lai: so sánh thứ của ngày đặt với DaysOfWeek của booking cố định
            var reqDow = GetCustomDayOfWeek(DateOnly.FromDateTime(request.StartDate));
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
        // re-use nowUtc defined above

        var exists = await query.AnyAsync(b =>
            // Only Active and Completed bookings block new bookings
            (b.Status == BookingCourtStatus.Active || b.Status == BookingCourtStatus.Completed)
            || (
                // PendingPayment bookings only block if they haven't expired
                b.Status == BookingCourtStatus.PendingPayment
                && (
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

        // Broadcast booking created (pending payment) event
        await _hub.Clients.All.SendAsync(
            "bookingCreated",
            new
            {
                id = entity.Id,
                status = entity.Status.ToString(),
                courtId = entity.CourtId,
                customerId = entity.CustomerId,
                startDate = entity.StartDate,
                endDate = entity.EndDate,
                startTime = entity.StartTime,
                endTime = entity.EndTime,
                daysOfWeek = entity.DaysOfWeek,
            }
        );

        // Tạo payment pending ngay sau khi tạo booking
        await _paymentService.CreatePaymentAsync(
            new CreatePaymentRequest { BookingId = entity.Id, CustomerId = entity.CustomerId }
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
                ? [GetCustomDayOfWeek(DateOnly.FromDateTime(request.StartDate))]
                : request.DaysOfWeek;

        foreach (var dow in days)
        {
            // Lấy tất cả rules phù hợp với ngày trong tuần và sắp xếp theo order
            var rules = await _context
                .CourtPricingRules.Where(r =>
                    r.CourtId == request.CourtId && r.DaysOfWeek.Contains(dow)
                )
                .OrderBy(r => r.Order)
                .ToListAsync();

            if (rules.Count == 0)
            {
                throw new ApiException(
                    $"Sân này chưa được cấu hình giá cho ngày {GetDayName(dow)}.",
                    HttpStatusCode.BadRequest
                );
            }

            // Kiểm tra xem có thể tính được giá cho toàn bộ khoảng thời gian không
            var currentTime = start;
            var canCalculateFullPeriod = true;

            while (currentTime < end && canCalculateFullPeriod)
            {
                var applicableRule = rules.FirstOrDefault(r =>
                    currentTime >= r.StartTime && currentTime < r.EndTime
                );

                if (applicableRule == null)
                {
                    canCalculateFullPeriod = false;
                    break;
                }

                // Chuyển sang thời gian tiếp theo
                currentTime = applicableRule.EndTime < end ? applicableRule.EndTime : end;
            }

            if (!canCalculateFullPeriod)
            {
                throw new ApiException(
                    $"Sân này chưa được cấu hình giá đầy đủ cho khung giờ {start:HH\\:mm}-{end:HH\\:mm} vào ngày {GetDayName(dow)}.",
                    HttpStatusCode.BadRequest
                );
            }
        }
    }

    private static string GetDayName(int dayOfWeek)
    {
        return dayOfWeek switch
        {
            2 => "Thứ 2",
            3 => "Thứ 3",
            4 => "Thứ 4",
            5 => "Thứ 5",
            6 => "Thứ 6",
            7 => "Thứ 7",
            8 => "Chủ nhật",
            _ => $"Ngày {dayOfWeek}",
        };
    }

    public async Task<List<ListBookingCourtResponse>> ListBookingCourtsAsync(
        ListBookingCourtRequest request
    )
    {
        var query = _context
            .BookingCourts.Include(x => x.Court)
            .Include(x => x.Customer)
            .AsQueryable();

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
            var fromDate = DateOnly.FromDateTime(request.FromDate.Value);
            query = query.Where(x => x.EndDate >= fromDate);
        }
        if (request.ToDate.HasValue)
        {
            var toDate = DateOnly.FromDateTime(request.ToDate.Value);
            query = query.Where(x => x.StartDate <= toDate);
        }

        var items = await query
            .OrderByDescending(x => x.StartDate)
            .ThenBy(x => x.StartTime)
            .Include(x => x.Customer)
            .Include(x => x.Payments)
            .ToListAsync();
        return _mapper.Map<List<ListBookingCourtResponse>>(items);
    }
}
