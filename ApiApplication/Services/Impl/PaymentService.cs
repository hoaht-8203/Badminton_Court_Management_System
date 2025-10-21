using ApiApplication.Data;
using ApiApplication.Dtos.Payment;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.SignalR;
using AutoMapper;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class PaymentService(
    ApplicationDbContext context,
    IMapper mapper,
    IHubContext<BookingHub> hub
) : IPaymentService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly IHubContext<BookingHub> _hub = hub;

    public async Task<DetailPaymentResponse> CreatePaymentAsync(CreatePaymentRequest request)
    {
        var booking = await _context
            .BookingCourts.Include(b => b.Customer)
            .Include(b => b.Court)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId);
        if (booking == null)
        {
            throw new ApiException($"Booking không tồn tại: {request.BookingId}");
        }

        var existed = await _context.Payments.FirstOrDefaultAsync(i =>
            i.BookingId == request.BookingId
        );
        if (existed != null)
        {
            return _mapper.Map<DetailPaymentResponse>(existed);
        }

        var payment = _mapper.Map<Payment>(booking);
        payment.Status = PaymentStatus.PendingPayment;

        // Calculate base amount for the booking (full amount)
        var fullAmount = await CalculateBookingAmountAsync(booking);

        // Determine amount to charge now (deposit or full)
        var payInFull = request.PayInFull == true;
        var depositPercent = request.DepositPercent.HasValue
            ? Math.Clamp(request.DepositPercent.Value, 0m, 1m)
            : 0.3m; // default 30%
        var method = string.IsNullOrWhiteSpace(request.PaymentMethod)
            ? "Bank"
            : request.PaymentMethod;

        payment.Amount = payInFull ? fullAmount : Math.Round(fullAmount * depositPercent, 2);
        payment.Id = await GenerateNextPaymentIdAsync();

        await _context.Payments.AddAsync(payment);
        await _context.SaveChangesAsync();

        // If payment method is Cash, mark as paid immediately and activate booking
        if (string.Equals(method, "Cash", StringComparison.OrdinalIgnoreCase))
        {
            payment.Status = PaymentStatus.Paid;
            if (payment.Booking != null)
            {
                if (payment.Booking.Status == BookingCourtStatus.PendingPayment)
                {
                    payment.Booking.Status = BookingCourtStatus.Active;
                }
            }
            await _context.SaveChangesAsync();
        }
        await _hub.Clients.All.SendAsync(
            "paymentCreated",
            new
            {
                id = payment.Id,
                bookingId = payment.BookingId,
                status = payment.Status.ToString(),
                amount = payment.Amount,
            }
        );
        return _mapper.Map<DetailPaymentResponse>(payment);
    }

    public async Task<DetailPaymentResponse?> DetailByBookingIdAsync(
        DetailPaymentByBookingIdRequest request
    )
    {
        var payment = await _context
            .Payments.Include(i => i.Booking)!
            .ThenInclude(b => b!.Customer)
            .Include(i => i.Booking)!
            .ThenInclude(b => b!.Court)
            .FirstOrDefaultAsync(i => i.BookingId == request.BookingId);
        return payment == null ? null : _mapper.Map<DetailPaymentResponse>(payment);
    }

    public async Task<DetailPaymentResponse?> DetailPaymentByIdAsync(DetailPaymentRequest request)
    {
        var payment = await _context
            .Payments.Include(i => i.Booking)!
            .ThenInclude(b => b!.Customer)
            .Include(i => i.Booking)!
            .ThenInclude(b => b!.Court)
            .FirstOrDefaultAsync(i => i.Id == request.Id);
        if (payment == null)
            return null;
        var dto = _mapper.Map<DetailPaymentResponse>(payment);
        await _hub.Clients.All.SendAsync(
            "paymentUpdated",
            new
            {
                id = dto.Id,
                bookingId = dto.BookingId,
                status = dto.Status?.ToString(),
                amount = dto.Amount,
            }
        );
        return dto;
    }

    private async Task<string> GenerateNextPaymentIdAsync()
    {
        var now = DateTime.Now;
        var prefix = $"PM-{now:ddMMyyyy}-";
        var lastId = await _context
            .Payments.AsNoTracking()
            .Where(i => i.Id.StartsWith(prefix))
            .OrderByDescending(i => i.Id)
            .Select(i => i.Id)
            .FirstOrDefaultAsync();
        var next = 1;
        if (!string.IsNullOrEmpty(lastId))
        {
            var numericPart = lastId.Substring(prefix.Length);
            if (int.TryParse(numericPart, out var parsed))
            {
                next = parsed + 1;
            }
        }
        return $"{prefix}{next.ToString("D6")}";
    }

    private async Task<decimal> CalculateBookingAmountAsync(BookingCourt booking)
    {
        // Helper: compute price for a single day-of-week using court rules and the booking's time range
        async Task<decimal> ComputePerDayAsync(int dayOfWeek)
        {
            var rules = await _context
                .CourtPricingRules.Where(r =>
                    r.CourtId == booking.CourtId && r.DaysOfWeek.Contains(dayOfWeek)
                )
                .OrderBy(r => r.Order)
                .ToListAsync();

            if (rules.Count == 0)
            {
                return 0m;
            }

            var totalForDay = 0m;
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
                var ruleEndTime =
                    applicableRule.EndTime < endTime ? applicableRule.EndTime : endTime;
                var hours = (decimal)
                    (ruleEndTime.ToTimeSpan() - currentTime.ToTimeSpan()).TotalHours;
                totalForDay += applicableRule.PricePerHour * hours;
                currentTime = ruleEndTime;
            }

            return totalForDay;
        }

        // Calculate court rental cost
        var courtCost = 0m;
        var daysArray = booking.DaysOfWeek ?? Array.Empty<int>();
        if (daysArray.Length > 0)
        {
            // Fixed schedule: sum for each applicable date between StartDate..EndDate inclusive
            var cursor = booking.StartDate;
            var end = booking.EndDate;
            while (cursor <= end)
            {
                var dow = GetCustomDayOfWeek(cursor);
                if (daysArray.Contains(dow))
                {
                    courtCost += await ComputePerDayAsync(dow);
                }
                cursor = cursor.AddDays(1);
            }
        }
        else
        {
            // Walk-in: single day (StartDate)
            var walkInDow = GetCustomDayOfWeek(booking.StartDate);
            courtCost = await ComputePerDayAsync(walkInDow);
        }

        // Calculate service costs
        var serviceCost = 0m;
        var bookingServices = await _context
            .BookingServices.Include(bs => bs.BookingCourtOccurrence)
            .Where(bs => bs.BookingCourtOccurrence.BookingCourtId == booking.Id)
            .ToListAsync();

        foreach (var bookingService in bookingServices)
        {
            serviceCost += bookingService.TotalPrice;
        }

        return Math.Round(courtCost + serviceCost, 2);
    }

    private static TimeOnly Max(TimeOnly a, TimeOnly b) => a > b ? a : b;

    private static TimeOnly Min(TimeOnly a, TimeOnly b) => a < b ? a : b;

    public async Task<DetailPaymentResponse> CreatePaymentForOrderAsync(
        CreatePaymentForOrderRequest request
    )
    {
        // Kiểm tra Order có tồn tại không
        var order = await _context
            .Orders.Include(o => o.Booking)
            .ThenInclude(b => b.Customer)
            .Include(o => o.Booking)
            .ThenInclude(b => b.Court)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId);

        if (order == null)
        {
            throw new ApiException("Không tìm thấy đơn hàng", System.Net.HttpStatusCode.BadRequest);
        }

        // Kiểm tra Booking có tồn tại không
        if (order.Booking == null)
        {
            throw new ApiException("Không tìm thấy đặt sân", System.Net.HttpStatusCode.BadRequest);
        }

        // Tạo Payment
        var payment = new Payment
        {
            Id = await GenerateNextPaymentIdAsync(),
            BookingId = request.BookingId,
            BookingCourtOccurrenceId = request.BookingOccurrenceId,
            OrderId = request.OrderId,
            CustomerId = request.CustomerId,
            Amount = request.Amount,
            Status = "PendingPayment", // Mặc định là PendingPayment
            Note = request.Note,
            PaymentCreatedAt = DateTime.UtcNow,
        };

        await _context.Payments.AddAsync(payment);
        await _context.SaveChangesAsync();

        // Load lại payment với đầy đủ thông tin
        var createdPayment = await _context
            .Payments.Include(p => p.Booking)
            .ThenInclude(b => b!.Court)
            .Include(p => p.Customer)
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.Id == payment.Id);

        if (createdPayment == null)
        {
            throw new ApiException(
                "Lỗi khi tạo thanh toán",
                System.Net.HttpStatusCode.InternalServerError
            );
        }

        return _mapper.Map<DetailPaymentResponse>(createdPayment);
    }

    private static int GetCustomDayOfWeek(DateOnly date)
    {
        var sys = (int)date.DayOfWeek;
        return sys == 0 ? 8 : sys + 1;
    }
}
