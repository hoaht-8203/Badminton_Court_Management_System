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
        payment.Amount = await CalculateBookingAmountAsync(booking);
        payment.Id = await GenerateNextPaymentIdAsync();

        await _context.Payments.AddAsync(payment);
        await _context.SaveChangesAsync();
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
        var dow = GetCustomDayOfWeek(booking.StartDate);

        // Lấy tất cả rules phù hợp với ngày trong tuần và sắp xếp theo order
        var rules = await _context
            .CourtPricingRules.Where(r =>
                r.CourtId == booking.CourtId && r.DaysOfWeek.Contains(dow)
            )
            .OrderBy(r => r.Order) // Sắp xếp theo order (order nhỏ hơn = ưu tiên cao hơn)
            .ToListAsync();

        if (rules.Count == 0)
        {
            return 0m;
        }

        var total = 0m;
        var currentTime = booking.StartTime;
        var endTime = booking.EndTime;

        // Chia thời gian theo từng rule theo thứ tự order
        while (currentTime < endTime)
        {
            // Tìm rule phù hợp cho thời điểm hiện tại
            var applicableRule = rules.FirstOrDefault(r =>
                currentTime >= r.StartTime && currentTime < r.EndTime
            );

            if (applicableRule == null)
            {
                // Không tìm thấy rule phù hợp, dừng tính toán
                break;
            }

            // Tính thời gian áp dụng rule này
            var ruleEndTime = applicableRule.EndTime < endTime ? applicableRule.EndTime : endTime;

            // Tính số giờ trong rule này
            var hours = (decimal)(ruleEndTime.ToTimeSpan() - currentTime.ToTimeSpan()).TotalHours;

            // Tính giá cho khoảng thời gian này
            var priceForThisPeriod = applicableRule.PricePerHour * hours;
            total += priceForThisPeriod;

            // Chuyển sang thời gian tiếp theo
            currentTime = ruleEndTime;
        }

        return Math.Round(total, 2);
    }

    private static TimeOnly Max(TimeOnly a, TimeOnly b) => a > b ? a : b;

    private static TimeOnly Min(TimeOnly a, TimeOnly b) => a < b ? a : b;

    private static int GetCustomDayOfWeek(DateOnly date)
    {
        var sys = (int)date.DayOfWeek;
        return sys == 0 ? 8 : sys + 1;
    }
}
