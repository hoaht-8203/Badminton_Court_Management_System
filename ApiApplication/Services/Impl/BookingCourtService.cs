using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Dtos.BookingCourt;
using ApiApplication.Dtos.Notification;
using ApiApplication.Dtos.Payment;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Enums;
using ApiApplication.Exceptions;
using ApiApplication.Services;
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
    IHubContext<BookingHub> hub,
    INotificationService notificationService
) : IBookingCourtService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly IPaymentService _paymentService = paymentService;
    private readonly IConfiguration _configuration = configuration;
    private readonly IHubContext<BookingHub> _hub = hub;
    private readonly INotificationService _notificationService = notificationService;

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
            (b.Status == BookingCourtStatus.Active)
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

        // Notify roles about new booking creation (pending payment)
        await _notificationService.SendToRolesAsync(
            new NotificationRoleSendRequestDto
            {
                Roles = new[] { "Receptionist", "branch-administrator" }, // Branch administrator assumed as Admin
                Title = "Đặt sân mới được tạo",
                Message = $"Booking #{entity.Id} cho sân {entity.CourtId} đã được tạo.",
                NotificationByType = NotificationCategory.Booking,
                Type = NotificationType.Info,
            }
        );

        // Create payment with preferences (deposit or full, method)
        var payInFull = request.PayInFull == true;
        var depositPercent = request.DepositPercent.HasValue
            ? Math.Clamp(request.DepositPercent.Value, 0m, 1m)
            : 0.3m; // default 30%
        var paymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod)
            ? "Bank"
            : request.PaymentMethod;

        await _paymentService.CreatePaymentAsync(
            new CreatePaymentRequest
            {
                BookingId = entity.Id,
                CustomerId = entity.CustomerId,
                PayInFull = payInFull,
                DepositPercent = depositPercent,
                PaymentMethod = paymentMethod,
            }
        );

        // Create BookingCourtOccurrence records for each occurrence
        await CreateBookingCourtOccurrencesAsync(entity, paymentMethod);

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

        // Note: email sending with payment link handled in higher layer (e.g., BookingCourtsController)

        // Return enriched detail (includes payment summary and QR info if applicable)
        return await DetailBookingCourtAsync(new DetailBookingCourtRequest { Id = entity.Id });
    }

    public async Task<DetailBookingCourtResponse> UserCreateBookingCourtAsync(
        UserCreateBookingCourtRequest request
    )
    {
        var user =
            await _context
                .Users.Include(u => u.Customer)
                .FirstOrDefaultAsync(u => u.Id == request.UserId)
            ?? throw new ApiException("Người dùng không tồn tại.", HttpStatusCode.BadRequest);

        if (user.Customer == null)
        {
            var customer = new Customer()
            {
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber ?? "",
                Email = user.Email ?? "",
                Status = CustomerStatus.Active,
                UserId = user.Id,
            };

            await _context.Customers.AddAsync(customer);
            user.Customer = customer;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

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
            (b.Status == BookingCourtStatus.Active)
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
        entity.CustomerId = user.Customer!.Id;
        entity.DaysOfWeek = reqDaysArr;
        // For receptionist flow, create booking as PendingPayment until SePay confirms
        entity.Status = BookingCourtStatus.PendingPayment;
        var holdMins = _configuration.GetValue<int?>("Booking:HoldMinutes") ?? 15;
        entity.HoldExpiresAtUtc = DateTime.UtcNow.AddMinutes(holdMins);

        await _context.BookingCourts.AddAsync(entity);
        await _context.SaveChangesAsync();

        // Notify roles about new booking creation (pending payment)
        await _notificationService.SendToRolesAsync(
            new NotificationRoleSendRequestDto
            {
                Roles = new[] { "Receptionist", "branch-administrator" }, // Branch administrator assumed as Admin
                Title = "Đặt sân mới được tạo",
                Message = $"Booking #{entity.Id} cho sân {entity.CourtId} đã được tạo.",
                NotificationByType = NotificationCategory.Booking,
                Type = NotificationType.Info,
            }
        );

        // Create payment with preferences (deposit or full, method)
        var payInFull = request.PayInFull == true;
        var depositPercent = 0.3m;
        var paymentMethod = "Bank";

        await _paymentService.CreatePaymentAsync(
            new CreatePaymentRequest
            {
                BookingId = entity.Id,
                CustomerId = entity.CustomerId,
                PayInFull = payInFull,
                DepositPercent = depositPercent,
                PaymentMethod = paymentMethod,
            }
        );

        // Create BookingCourtOccurrence records for each occurrence
        await CreateBookingCourtOccurrencesAsync(entity, paymentMethod);

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

        // Note: email sending with payment link handled in higher layer (e.g., BookingCourtsController)

        // Return enriched detail (includes payment summary and QR info if applicable)
        return await DetailBookingCourtAsync(new DetailBookingCourtRequest { Id = entity.Id });
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

    private async Task EnsurePricingConfiguredForRequestAsync(UserCreateBookingCourtRequest request)
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

    public async Task<List<ListBookingCourtOccurrenceResponse>> ListBookingCourtOccurrencesAsync(
        ListBookingCourtOccurrenceRequest request
    )
    {
        var query = _context
            .BookingCourtOccurrences.Include(x => x.BookingCourt)
            .ThenInclude(x => x.Court)
            .Include(x => x.BookingCourt)
            .ThenInclude(x => x.Customer)
            .AsQueryable();

        if (request.CustomerId.HasValue)
        {
            query = query.Where(x => x.BookingCourt!.CustomerId == request.CustomerId.Value);
        }
        if (request.CourtId.HasValue)
        {
            query = query.Where(x => x.BookingCourt!.CourtId == request.CourtId.Value);
        }
        if (request.FromDate.HasValue)
        {
            var fromDate = DateOnly.FromDateTime(request.FromDate.Value);
            query = query.Where(x => x.Date >= fromDate);
        }
        if (request.ToDate.HasValue)
        {
            var toDate = DateOnly.FromDateTime(request.ToDate.Value);
            query = query.Where(x => x.Date <= toDate);
        }
        if (!string.IsNullOrEmpty(request.Status))
        {
            query = query.Where(x => x.Status == request.Status);
        }

        var items = await query
            .OrderByDescending(x => x.Date)
            .ThenBy(x => x.StartTime)
            .ToListAsync();

        return items
            .Select(x => new ListBookingCourtOccurrenceResponse
            {
                Id = x.Id,
                BookingCourtId = x.BookingCourtId,
                Date = x.Date,
                StartTime = x.StartTime,
                EndTime = x.EndTime,
                Status = x.Status,
                Note = x.Note,
                CustomerName = x.BookingCourt?.Customer?.FullName ?? string.Empty,
                CourtName = x.BookingCourt?.Court?.Name ?? string.Empty,
                CourtId = x.BookingCourt?.CourtId ?? Guid.Empty,
                CustomerId = x.BookingCourt?.CustomerId ?? 0,
                StartDate = x.Date.ToString("yyyy-MM-dd"),
                EndDate = x.Date.ToString("yyyy-MM-dd"),
            })
            .ToList();
    }

    public async Task<DetailBookingCourtResponse> DetailBookingCourtAsync(
        DetailBookingCourtRequest request
    )
    {
        var entity = await _context
            .BookingCourts.Include(x => x.Court)
            .Include(x => x.Customer)
            .Include(x => x.Payments)
            .Include(x => x.BookingCourtOccurrences)
            .ThenInclude(x => x.Payments)
            .Include(x => x.BookingCourtOccurrences)
            .ThenInclude(x => x.BookingServices)
            .Include(x => x.BookingCourtOccurrences)
            .ThenInclude(x => x.BookingOrderItems)
            .ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.Id == request.Id);

        if (entity == null)
        {
            throw new ApiException("Không tìm thấy đặt sân", HttpStatusCode.BadRequest);
        }

        var dto = _mapper.Map<DetailBookingCourtResponse>(entity);

        // Compute totals - calculate from all occurrences
        var totalAmount = 0m;
        foreach (var occurrence in entity.BookingCourtOccurrences)
        {
            var occurrenceAmount = await CalculateBookingAmountForOccurrenceAsync(occurrence);
            totalAmount += occurrenceAmount;
        }

        // Only count payments directly related to this booking (not occurrence-specific payments)
        var paidAmount = entity
            .Payments.Where(p =>
                p.Status == PaymentStatus.Paid && p.BookingCourtOccurrenceId == null
            )
            .Sum(p => p.Amount);
        dto.TotalAmount = Math.Ceiling(totalAmount);
        dto.PaidAmount = Math.Ceiling(paidAmount);
        dto.RemainingAmount = Math.Max(0, Math.Ceiling(totalAmount - paidAmount));

        // Infer payment type from first payment amount vs total
        if (entity.Payments.Count == 0)
        {
            dto.PaymentType = "None";
        }
        else
        {
            var first = entity.Payments.OrderBy(p => p.PaymentCreatedAt).First();
            var ratio = totalAmount == 0 ? 0 : first.Amount / totalAmount;
            dto.PaymentType = ratio >= 0.99m ? "Full" : "Deposit";
            // Inline QR info for transfer (pending) case
            if (
                !string.Equals(first.Status, PaymentStatus.Paid, StringComparison.OrdinalIgnoreCase)
            )
            {
                dto.PaymentId = first.Id;
                dto.PaymentAmount = first.Amount;
                var acc = Environment.GetEnvironmentVariable("SEPAY_ACC") ?? "VQRQAEMLF5363";
                var bank = Environment.GetEnvironmentVariable("SEPAY_BANK") ?? "MBBank";
                var amount = ((long)Math.Ceiling(first.Amount)).ToString();
                var des = Uri.EscapeDataString(first.Id);
                dto.QrUrl =
                    $"https://qr.sepay.vn/img?acc={acc}&bank={bank}&amount={amount}&des={des}";
                var holdMins = _configuration.GetValue<int?>("Booking:HoldMinutes") ?? 5;
                dto.HoldMinutes = holdMins;
                dto.ExpiresAtUtc = first.PaymentCreatedAt.AddMinutes(holdMins);
            }
        }

        // Late fee calculation is now handled at the occurrence level
        dto.OverdueMinutes = 0;
        dto.OverdueHours = 0m;
        dto.SurchargeAmount = 0m;

        return dto;
    }

    public async Task<DetailBookingCourtOccurrenceResponse> DetailBookingCourtOccurrenceAsync(
        DetailBookingCourtOccurrenceRequest request
    )
    {
        var entity = await _context
            .BookingCourtOccurrences.Include(x => x.BookingCourt)
            .ThenInclude(x => x.Court)
            .Include(x => x.BookingCourt)
            .ThenInclude(x => x.Customer)
            .Include(x => x.BookingCourt)
            .ThenInclude(x => x.Payments)
            .Include(x => x.BookingCourt)
            .ThenInclude(x => x.BookingCourtOccurrences)
            .Include(x => x.Payments)
            .Include(x => x.BookingServices)
            .ThenInclude(x => x.Service)
            .Include(x => x.BookingOrderItems)
            .ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.Id == request.Id);

        if (entity == null)
        {
            throw new ApiException("Không tìm thấy lịch sân", HttpStatusCode.BadRequest);
        }

        var dto = _mapper.Map<DetailBookingCourtOccurrenceResponse>(entity);

        // Compute totals
        var totalAmount = await CalculateBookingAmountForOccurrenceAsync(entity);

        // Calculate payment amounts for this specific occurrence
        // Get booking-level payments and distribute proportionally
        var booking = entity.BookingCourt!;
        var bookingPayments = booking.Payments.Where(p =>
            p.Status == PaymentStatus.Paid && p.BookingCourtOccurrenceId == null
        );
        var totalBookingPaid = bookingPayments.Sum(p => p.Amount);

        // Calculate total booking amount to determine proportion
        var totalBookingAmount = await CalculateBookingAmountForEntityAsync(booking);
        var totalOccurrences = booking.BookingCourtOccurrences.Count;

        // Distribute booking payment proportionally across occurrences
        var paidAmountPerOccurrence =
            totalOccurrences > 0 ? totalBookingPaid / totalOccurrences : 0;

        dto.TotalAmount = Math.Ceiling(totalAmount);
        dto.PaidAmount = Math.Ceiling(paidAmountPerOccurrence);
        dto.RemainingAmount = Math.Max(0, Math.Ceiling(totalAmount - paidAmountPerOccurrence));

        // Calculate total hours
        dto.TotalHours = (decimal)
            (entity.EndTime.ToTimeSpan() - entity.StartTime.ToTimeSpan()).TotalHours;

        // Infer payment type from booking payment amount vs total booking amount
        if (bookingPayments.Count() == 0)
        {
            dto.PaymentType = "None";
        }
        else
        {
            var first = bookingPayments.OrderBy(p => p.PaymentCreatedAt).First();
            var ratio = totalBookingAmount == 0 ? 0 : totalBookingPaid / totalBookingAmount;
            dto.PaymentType = ratio >= 0.99m ? "Full" : "Deposit";
            // Inline QR info for transfer (pending) case
            if (
                !string.Equals(first.Status, PaymentStatus.Paid, StringComparison.OrdinalIgnoreCase)
            )
            {
                dto.PaymentId = first.Id;
                dto.PaymentAmount = paidAmountPerOccurrence;
                var acc = Environment.GetEnvironmentVariable("SEPAY_ACC") ?? "VQRQAEMLF5363";
                var bank = Environment.GetEnvironmentVariable("SEPAY_BANK") ?? "MBBank";
                var amount = ((long)Math.Ceiling(paidAmountPerOccurrence)).ToString();
                var des = Uri.EscapeDataString(first.Id);
                dto.QrUrl =
                    $"https://qr.sepay.vn/img?acc={acc}&bank={bank}&amount={amount}&des={des}";
                var holdMins = _configuration.GetValue<int?>("Booking:HoldMinutes") ?? 5;
                dto.HoldMinutes = holdMins;
                dto.ExpiresAtUtc = first.PaymentCreatedAt.AddMinutes(holdMins);
            }
        }

        // Calculate late fee for this specific occurrence (use local time for business hours)
        var now = DateTime.Now;
        var occurrenceDate = entity.Date.ToDateTime(TimeOnly.MinValue);
        var startDateTime = DateTime.SpecifyKind(
            occurrenceDate.Add(entity.StartTime.ToTimeSpan()),
            DateTimeKind.Local
        );
        var endDateTime = DateTime.SpecifyKind(
            occurrenceDate.Add(entity.EndTime.ToTimeSpan()),
            DateTimeKind.Local
        );

        // Only calculate late fee if occurrence is CheckedIn and current time is past end time
        if (entity.Status == BookingCourtOccurrenceStatus.CheckedIn && now > endDateTime)
        {
            var overdueMinutes = (int)(now - endDateTime).TotalMinutes;
            var overdueHours = (decimal)(now - endDateTime).TotalHours;

            dto.OverdueMinutes = overdueMinutes;
            dto.OverdueHours = Math.Round(overdueHours, 2);

            // Calculate surcharge: only charge for minutes beyond 15 minutes
            if (overdueMinutes > 15)
            {
                var chargeableMinutes = overdueMinutes - 15;
                var totalMinutes = (decimal)
                    (entity.EndTime.ToTimeSpan() - entity.StartTime.ToTimeSpan()).TotalMinutes;
                var baseMinuteRate = totalAmount / totalMinutes;

                // Apply late fee percentage (default 150%)
                var lateFeeRate = baseMinuteRate * (dto.LateFeePercentage / 100m);
                var surchargeAmount = Math.Ceiling(chargeableMinutes * lateFeeRate);
                dto.SurchargeAmount = Math.Ceiling(surchargeAmount / 1000) * 1000;
            }
            else
            {
                dto.SurchargeAmount = 0m;
            }
        }
        else
        {
            dto.OverdueMinutes = 0;
            dto.OverdueHours = 0m;
            dto.SurchargeAmount = 0m;
        }

        // Calculate service usage information
        await CalculateServiceUsageInfoAsync(entity, dto, now);

        return dto;
    }

    public async Task<bool> CancelBookingCourtAsync(CancelBookingCourtRequest request)
    {
        // Find the specific occurrence
        var occurrence = await _context
            .BookingCourtOccurrences.Include(o => o.BookingCourt)
            .FirstOrDefaultAsync(o => o.Id == request.Id);

        if (occurrence == null)
        {
            throw new ApiException("Không tìm thấy lịch sân", HttpStatusCode.BadRequest);
        }

        if (occurrence.Status == BookingCourtOccurrenceStatus.Cancelled)
        {
            return true;
        }

        occurrence.Status = BookingCourtOccurrenceStatus.Cancelled;

        // Cancel related payments for this occurrence
        foreach (var p in occurrence.Payments)
        {
            if (p.Status == PaymentStatus.PendingPayment || p.Status == PaymentStatus.Unpaid)
            {
                p.Status = PaymentStatus.Cancelled;
            }
        }

        await _context.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("bookingUpdated", occurrence.BookingCourtId);
        await _hub.Clients.All.SendAsync("occurrenceCancelled", occurrence.Id);
        await _hub.Clients.All.SendAsync(
            "paymentsCancelled",
            new { bookingId = occurrence.BookingCourtId }
        );

        return true;
    }

    public async Task<bool> CheckInOccurrenceAsync(CheckInBookingCourtRequest request)
    {
        // Find the specific occurrence
        var occurrence = await _context
            .BookingCourtOccurrences.Include(o => o.BookingCourt)
            .FirstOrDefaultAsync(o => o.Id == request.Id);

        if (occurrence == null)
        {
            throw new ApiException("Không tìm thấy lịch sân", HttpStatusCode.BadRequest);
        }

        if (occurrence.BookingCourt!.Status != BookingCourtStatus.Active)
        {
            throw new ApiException("Đặt sân chưa được kích hoạt", HttpStatusCode.BadRequest);
        }

        if (occurrence.Status == BookingCourtOccurrenceStatus.Cancelled)
        {
            throw new ApiException("Lịch sân đã bị hủy", HttpStatusCode.BadRequest);
        }

        if (occurrence.Status == BookingCourtOccurrenceStatus.CheckedIn)
        {
            throw new ApiException("Lịch sân đã được check-in", HttpStatusCode.BadRequest);
        }

        // Validate time window: only check-in during valid time
        var now = DateTime.Now;
        var occurrenceDate = occurrence.Date.ToDateTime(TimeOnly.MinValue);

        // Create full DateTime objects for comparison
        var startDateTime = occurrenceDate.Add(occurrence.StartTime.ToTimeSpan());
        var endDateTime = occurrenceDate.Add(occurrence.EndTime.ToTimeSpan());

        // Allow 10 minutes before start time
        var earlyStartDateTime = startDateTime.AddMinutes(-10);

        // Check if current time is within the valid check-in window
        if (!(earlyStartDateTime <= now && now <= endDateTime))
        {
            throw new ApiException(
                "Chỉ có thể check-in trong khung giờ đã đặt",
                HttpStatusCode.BadRequest
            );
        }

        // Update occurrence status
        occurrence.Status = BookingCourtOccurrenceStatus.CheckedIn;

        // Update court status to InUse
        var court = await _context.Courts.FirstOrDefaultAsync(c =>
            c.Id == occurrence.BookingCourt!.CourtId
        );
        if (court != null)
        {
            court.Status = CourtStatus.InUse;
        }

        if (!string.IsNullOrWhiteSpace(request.Note))
        {
            occurrence.Note = string.IsNullOrWhiteSpace(occurrence.Note)
                ? request.Note
                : occurrence.Note + "\n" + request.Note;
        }

        await _context.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("bookingUpdated", occurrence.BookingCourtId);
        await _hub.Clients.All.SendAsync("occurrenceCheckedIn", occurrence.Id);
        return true;
    }

    public async Task<bool> CheckOutOccurrenceAsync(CheckOutBookingCourtRequest request)
    {
        // Find the specific occurrence
        var occurrence = await _context
            .BookingCourtOccurrences.Include(o => o.BookingCourt)
            .FirstOrDefaultAsync(o => o.Id == request.Id);

        if (occurrence == null)
        {
            throw new ApiException("Không tìm thấy lịch sân", HttpStatusCode.BadRequest);
        }

        if (occurrence.Status != BookingCourtOccurrenceStatus.CheckedIn)
        {
            throw new ApiException("Phải check-in trước khi checkout", HttpStatusCode.BadRequest);
        }

        // Update occurrence status
        occurrence.Status = BookingCourtOccurrenceStatus.Completed;

        // Restore court status to Active
        var court = await _context.Courts.FirstOrDefaultAsync(c =>
            c.Id == occurrence.BookingCourt!.CourtId
        );
        if (court != null)
        {
            court.Status = CourtStatus.Active;
        }

        if (!string.IsNullOrWhiteSpace(request.Note))
        {
            occurrence.Note = string.IsNullOrWhiteSpace(occurrence.Note)
                ? request.Note
                : occurrence.Note + "\n" + request.Note;
        }

        await _context.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("bookingUpdated", occurrence.BookingCourtId);
        await _hub.Clients.All.SendAsync("occurrenceCheckedOut", occurrence.Id);
        return true;
    }

    public async Task<bool> MarkOccurrenceNoShowAsync(NoShowBookingCourtRequest request)
    {
        // Find the specific occurrence
        var occurrence = await _context
            .BookingCourtOccurrences.Include(o => o.BookingCourt)
            .FirstOrDefaultAsync(o => o.Id == request.Id);

        if (occurrence == null)
        {
            throw new ApiException("Không tìm thấy lịch sân", HttpStatusCode.BadRequest);
        }

        if (occurrence.Status == BookingCourtOccurrenceStatus.Completed)
        {
            return true; // Already completed
        }

        // Update occurrence status
        occurrence.Status = BookingCourtOccurrenceStatus.NoShow;

        // Free up court on no-show
        var court = await _context.Courts.FirstOrDefaultAsync(c =>
            c.Id == occurrence.BookingCourt!.CourtId
        );
        if (court != null)
        {
            court.Status = CourtStatus.Active;
        }

        if (!string.IsNullOrWhiteSpace(request.Note))
        {
            occurrence.Note = string.IsNullOrWhiteSpace(occurrence.Note)
                ? request.Note
                : occurrence.Note + "\n" + request.Note;
        }

        await _context.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("bookingUpdated", occurrence.BookingCourtId);
        await _hub.Clients.All.SendAsync("occurrenceNoShow", occurrence.Id);
        return true;
    }

    public async Task<bool> AddOrderItemAsync(AddOrderItemRequest request)
    {
        // Find the specific occurrence
        var occurrence = await _context
            .BookingCourtOccurrences.Include(o => o.BookingCourt)
            .FirstOrDefaultAsync(o => o.Id == request.BookingCourtOccurrenceId);

        if (occurrence == null)
        {
            throw new ApiException("Không tìm thấy lịch sân", HttpStatusCode.BadRequest);
        }

        if (occurrence.BookingCourt!.Status != BookingCourtStatus.Active)
        {
            throw new ApiException(
                "Chỉ thêm món cho lịch đang hoạt động",
                HttpStatusCode.BadRequest
            );
        }

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId);
        if (product == null)
        {
            throw new ApiException("Không tìm thấy sản phẩm", HttpStatusCode.BadRequest);
        }
        var qty = Math.Max(1, request.Quantity);
        var unit = product.SalePrice;

        var existing = await _context.BookingOrderItems.FirstOrDefaultAsync(x =>
            x.BookingCourtOccurrenceId == occurrence.Id && x.ProductId == request.ProductId
        );
        if (existing != null)
        {
            existing.Quantity += qty;
            existing.TotalPrice = existing.Quantity * existing.UnitPrice;
        }
        else
        {
            var item = new BookingOrderItem
            {
                Id = Guid.NewGuid(),
                BookingCourtOccurrenceId = occurrence.Id,
                ProductId = product.Id,
                Quantity = qty,
                UnitPrice = unit,
                TotalPrice = unit * qty,
            };
            await _context.BookingOrderItems.AddAsync(item);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<BookingOrderItemResponse>> ListOrderItemsAsync(Guid occurrenceId)
    {
        var items = await _context
            .BookingOrderItems.Include(x => x.Product)
            .Where(x => x.BookingCourtOccurrenceId == occurrenceId)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync();

        return items
            .Select(x => new BookingOrderItemResponse
            {
                ProductId = x.ProductId,
                ProductName = x.Product?.Name ?? string.Empty,
                Image = x.Product?.Images?.FirstOrDefault(),
                UnitPrice = x.UnitPrice,
                Quantity = x.Quantity,
            })
            .ToList();
    }

    public async Task<bool> UpdateOrderItemAsync(UpdateOrderItemRequest request)
    {
        // Find the specific occurrence
        var occurrence = await _context
            .BookingCourtOccurrences.Include(o => o.BookingCourt)
            .FirstOrDefaultAsync(o => o.Id == request.BookingCourtOccurrenceId);

        if (occurrence == null)
        {
            throw new ApiException("Không tìm thấy lịch sân", HttpStatusCode.BadRequest);
        }

        if (occurrence.BookingCourt!.Status != BookingCourtStatus.Active)
        {
            throw new ApiException(
                "Chỉ cập nhật món cho lịch đang hoạt động",
                HttpStatusCode.BadRequest
            );
        }

        var existing = await _context.BookingOrderItems.FirstOrDefaultAsync(x =>
            x.BookingCourtOccurrenceId == occurrence.Id && x.ProductId == request.ProductId
        );
        if (existing == null)
        {
            if (request.Quantity <= 0)
                return true;
            var product =
                await _context.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId)
                ?? throw new ApiException("Không tìm thấy sản phẩm", HttpStatusCode.BadRequest);
            var unit = product.SalePrice;
            var qty = Math.Max(1, request.Quantity);
            var item = new BookingOrderItem
            {
                Id = Guid.NewGuid(),
                BookingCourtOccurrenceId = occurrence.Id,
                ProductId = product.Id,
                Quantity = qty,
                UnitPrice = unit,
                TotalPrice = unit * qty,
            };
            await _context.BookingOrderItems.AddAsync(item);
        }
        else
        {
            if (request.Quantity <= 0)
            {
                _context.BookingOrderItems.Remove(existing);
            }
            else
            {
                existing.Quantity = request.Quantity;
                existing.TotalPrice = existing.UnitPrice * existing.Quantity;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<decimal> CalculateBookingAmountForEntityAsync(BookingCourt booking)
    {
        var dow = GetCustomDayOfWeek(booking.StartDate);
        var rules = await _context
            .CourtPricingRules.Where(r =>
                r.CourtId == booking.CourtId && r.DaysOfWeek.Contains(dow)
            )
            .OrderBy(r => r.Order)
            .ToListAsync();

        if (rules.Count == 0)
        {
            return 0m;
        }

        var total = 0m;
        var currentTime = booking.StartTime;
        var endTime = booking.EndTime;

        while (currentTime < endTime)
        {
            var applicableRule = rules.FirstOrDefault(r =>
                currentTime >= r.StartTime && currentTime < r.EndTime
            );
            if (applicableRule == null)
            {
                break;
            }
            var ruleEndTime = applicableRule.EndTime < endTime ? applicableRule.EndTime : endTime;
            var hours = (decimal)(ruleEndTime.ToTimeSpan() - currentTime.ToTimeSpan()).TotalHours;
            var priceForThisPeriod = applicableRule.PricePerHour * hours;
            total += priceForThisPeriod;
            currentTime = ruleEndTime;
        }

        return Math.Ceiling(total);
    }

    private async Task<decimal> CalculateBookingAmountForOccurrenceAsync(
        BookingCourtOccurrence occurrence
    )
    {
        var dow = GetCustomDayOfWeek(occurrence.Date);
        var rules = await _context
            .CourtPricingRules.Where(r =>
                r.CourtId == occurrence.BookingCourt!.CourtId && r.DaysOfWeek.Contains(dow)
            )
            .OrderBy(r => r.Order)
            .ToListAsync();

        if (rules.Count == 0)
        {
            return 0m;
        }

        var total = 0m;
        var currentTime = occurrence.StartTime;
        var endTime = occurrence.EndTime;

        while (currentTime < endTime)
        {
            var applicableRule = rules.FirstOrDefault(r =>
                currentTime >= r.StartTime && currentTime < r.EndTime
            );
            if (applicableRule == null)
            {
                break;
            }
            var ruleEndTime = applicableRule.EndTime < endTime ? applicableRule.EndTime : endTime;
            var hours = (decimal)(ruleEndTime.ToTimeSpan() - currentTime.ToTimeSpan()).TotalHours;
            var priceForThisPeriod = applicableRule.PricePerHour * hours;
            total += priceForThisPeriod;
            currentTime = ruleEndTime;
        }

        return Math.Ceiling(total);
    }

    private async Task<List<CourtPriceRule>?> GetCurrentCourtPricingAsync(
        Guid courtId,
        DateOnly date
    )
    {
        var dow = GetCustomDayOfWeek(date);
        var rules = await _context
            .CourtPricingRules.Where(r => r.CourtId == courtId && r.DaysOfWeek.Contains(dow))
            .OrderBy(r => r.Order)
            .ToListAsync();

        if (!rules.Any())
            return null;

        return rules
            .Select(r => new CourtPriceRule
            {
                StartTime = r.StartTime,
                EndTime = r.EndTime,
                PricePerHour = r.PricePerHour,
            })
            .ToList();
    }

    private CourtPriceRule? GetApplicablePriceForTime(List<CourtPriceRule> pricing, TimeOnly time)
    {
        return pricing.FirstOrDefault(p => time >= p.StartTime && time < p.EndTime);
    }

    private async Task CreateBookingCourtOccurrencesAsync(
        BookingCourt booking,
        string paymentMethod
    )
    {
        var occurrences = new List<BookingCourtOccurrence>();

        // Determine status based on payment method
        var occurrenceStatus = string.Equals(
            paymentMethod,
            "Cash",
            StringComparison.OrdinalIgnoreCase
        )
            ? BookingCourtOccurrenceStatus.Active
            : BookingCourtOccurrenceStatus.PendingPayment;

        if (booking.DaysOfWeek == null || booking.DaysOfWeek.Length == 0)
        {
            // One-time booking - create single occurrence
            var occurrence = new BookingCourtOccurrence
            {
                Id = Guid.NewGuid(),
                BookingCourtId = booking.Id,
                Date = booking.StartDate,
                StartTime = booking.StartTime,
                EndTime = booking.EndTime,
                Status = occurrenceStatus,
                Note = booking.Note,
            };
            occurrences.Add(occurrence);
        }
        else
        {
            // Recurring booking - create occurrences for each day in the range
            var currentDate = booking.StartDate;
            while (currentDate <= booking.EndDate)
            {
                var dow = GetCustomDayOfWeek(currentDate);
                if (booking.DaysOfWeek.Contains(dow))
                {
                    var occurrence = new BookingCourtOccurrence
                    {
                        Id = Guid.NewGuid(),
                        BookingCourtId = booking.Id,
                        Date = currentDate,
                        StartTime = booking.StartTime,
                        EndTime = booking.EndTime,
                        Status = occurrenceStatus,
                        Note = booking.Note,
                    };
                    occurrences.Add(occurrence);
                }
                currentDate = currentDate.AddDays(1);
            }
        }

        if (occurrences.Any())
        {
            await _context.BookingCourtOccurrences.AddRangeAsync(occurrences);
            await _context.SaveChangesAsync();
        }
    }

    private async Task CalculateServiceUsageInfoAsync(
        BookingCourtOccurrence occurrence,
        DetailBookingCourtOccurrenceResponse dto,
        DateTime now
    )
    {
        var bookingServices = await _context
            .BookingServices.Include(bs => bs.Service)
            .Where(bs => bs.BookingCourtOccurrenceId == occurrence.Id)
            .ToListAsync();

        var serviceUsageInfo = new List<ServiceUsageInfo>();

        foreach (var bookingService in bookingServices)
        {
            var usageTime = bookingService.ServiceEndTime.HasValue
                ? bookingService.ServiceEndTime.Value - bookingService.ServiceStartTime
                : now - bookingService.ServiceStartTime;

            var usageHours = (decimal)usageTime.TotalHours;
            var usageMinutes = (int)usageTime.TotalMinutes;

            // Calculate current cost (if still in use) or final cost (if completed)
            var currentCost = bookingService.ServiceEndTime.HasValue
                ? bookingService.TotalPrice
                : Math.Ceiling(
                    bookingService.Quantity * bookingService.UnitPrice * Math.Ceiling(usageHours)
                );

            serviceUsageInfo.Add(
                new ServiceUsageInfo
                {
                    ServiceName = bookingService.Service.Name ?? "Unknown Service",
                    Quantity = bookingService.Quantity,
                    UsageHours = Math.Ceiling(usageHours),
                    UsageMinutes = usageMinutes,
                    UnitPrice = bookingService.UnitPrice,
                    TotalCost = currentCost,
                    IsCompleted = bookingService.ServiceEndTime.HasValue,
                }
            );
        }

        // Add service usage info to DTO (you'll need to add this property to DetailBookingCourtOccurrenceResponse)
        // dto.ServiceUsageInfo = serviceUsageInfo;
    }

    private class CourtPriceRule
    {
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public decimal PricePerHour { get; set; }
    }

    private class ServiceUsageInfo
    {
        public string ServiceName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UsageHours { get; set; }
        public int UsageMinutes { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalCost { get; set; }
        public bool IsCompleted { get; set; }
    }
}
