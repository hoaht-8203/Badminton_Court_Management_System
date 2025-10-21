using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.Order;
using ApiApplication.Entities;
using ApiApplication.Enums;
using ApiApplication.Exceptions;
using ApiApplication.Services;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class OrderService(
    ApplicationDbContext context,
    IMapper mapper,
    IPaymentService paymentService,
    IConfiguration configuration
) : IOrderService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly IPaymentService _paymentService = paymentService;
    private readonly IConfiguration _configuration = configuration;

    public async Task<CheckoutResponse> CheckoutAsync(CheckoutRequest request)
    {
        // Lấy thông tin occurrence
        var occurrence = await _context
            .BookingCourtOccurrences.Include(x => x.BookingCourt)
            .ThenInclude(x => x!.Court)
            .Include(x => x.BookingCourt)
            .ThenInclude(x => x!.Customer)
            .Include(x => x.BookingCourt)
            .ThenInclude(x => x!.Payments)
            .Include(x => x.BookingCourt)
            .ThenInclude(x => x!.BookingCourtOccurrences)
            .Include(x => x.BookingOrderItems)
            .ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.Id == request.BookingCourtOccurrenceId);

        if (occurrence == null)
        {
            throw new ApiException("Không tìm thấy lịch sân", HttpStatusCode.BadRequest);
        }

        var booking = occurrence.BookingCourt!;

        if (occurrence.Status != "CheckedIn")
        {
            throw new ApiException(
                "Chỉ có thể checkout cho lịch đang check-in",
                HttpStatusCode.BadRequest
            );
        }

        // Tính toán thông tin thanh toán sân
        var courtTotalAmount = await CalculateBookingAmountForOccurrenceAsync(occurrence);

        // Tính số lượng occurrences trong booking để chia đều deposit
        var totalOccurrences = booking.BookingCourtOccurrences.Count;
        var totalPaidAmount = booking.Payments.Where(p => p.Status == "Paid").Sum(p => p.Amount);
        var paidAmountPerOccurrence = totalOccurrences > 0 ? totalPaidAmount / totalOccurrences : 0;

        var courtRemainingAmount = Math.Max(0, courtTotalAmount - paidAmountPerOccurrence);

        // Tính toán tổng tiền món hàng từ occurrence cụ thể
        var itemsSubtotal = occurrence.BookingOrderItems?.Sum(x => x.TotalPrice) ?? 0m;

        // Tính toán phí muộn
        var lateFeeResult = await CalculateLateFeeAsync(occurrence, request.LateFeePercentage);
        var overdueMinutes = lateFeeResult.overdueMinutes;
        var lateFeeAmount = lateFeeResult.lateFeeAmount;

        // Tổng thanh toán
        var totalAmount = courtRemainingAmount + itemsSubtotal + lateFeeAmount;

        // Xác định trạng thái order và payment dựa trên phương thức thanh toán
        var isCashPayment = string.Equals(
            request.PaymentMethod,
            "Cash",
            StringComparison.OrdinalIgnoreCase
        );
        var orderStatus = isCashPayment ? OrderStatus.Paid : OrderStatus.Pending;
        var paymentStatus = isCashPayment ? "Paid" : "PendingPayment";

        // Tạo Order
        var order = new Order
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            CustomerId = booking.CustomerId,
            CourtTotalAmount = courtTotalAmount,
            CourtPaidAmount = paidAmountPerOccurrence,
            CourtRemainingAmount = courtRemainingAmount,
            ItemsSubtotal = itemsSubtotal,
            LateFeePercentage = request.LateFeePercentage,
            LateFeeAmount = lateFeeAmount,
            OverdueMinutes = overdueMinutes,
            TotalAmount = totalAmount,
            Status = orderStatus,
            Note = request.Note,
        };

        await _context.Orders.AddAsync(order);
        await _context.SaveChangesAsync();

        // Cập nhật trạng thái occurrence và court sau khi checkout thành công
        occurrence.Status = "Completed";
        if (booking.Court != null)
        {
            booking.Court.Status = "Active";
        }
        await _context.SaveChangesAsync();

        // Tạo Payment cho Order
        var payment = await _paymentService.CreatePaymentForOrderAsync(
            new Dtos.Payment.CreatePaymentForOrderRequest
            {
                OrderId = order.Id,
                BookingId = booking.Id,
                BookingOccurrenceId = occurrence.Id,
                CustomerId = booking.CustomerId,
                Amount = totalAmount,
                PaymentMethod = request.PaymentMethod,
                Note = request.Note,
            }
        );

        // Cập nhật status của payment dựa trên phương thức thanh toán
        var createdPayment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == payment.Id);
        if (createdPayment != null)
        {
            createdPayment.Status = paymentStatus;
            order.Payments.Add(createdPayment);
            await _context.SaveChangesAsync();
        }

        // Tạo QR URL cho thanh toán (chỉ khi thanh toán chuyển khoản)
        string qrUrl = string.Empty;
        var holdMins = 0;
        if (!isCashPayment)
        {
            var acc = Environment.GetEnvironmentVariable("SEPAY_ACC") ?? "VQRQAEMLF5363";
            var bank = Environment.GetEnvironmentVariable("SEPAY_BANK") ?? "MBBank";
            var amount = ((long)Math.Round(totalAmount, 0)).ToString();
            var des = Uri.EscapeDataString(order.Id.ToString());
            qrUrl = $"https://qr.sepay.vn/img?acc={acc}&bank={bank}&amount={amount}&des={des}";
            holdMins = _configuration.GetValue<int?>("Booking:HoldMinutes") ?? 15;
        }

        return new CheckoutResponse
        {
            OrderId = order.Id,
            BookingId = booking.Id,
            CustomerId = booking.CustomerId,
            CustomerName = booking.Customer?.FullName ?? string.Empty,
            CourtName = booking.Court?.Name ?? string.Empty,
            CourtTotalAmount = courtTotalAmount,
            CourtPaidAmount = paidAmountPerOccurrence,
            CourtRemainingAmount = courtRemainingAmount,
            ItemsSubtotal = itemsSubtotal,
            LateFeePercentage = request.LateFeePercentage,
            LateFeeAmount = lateFeeAmount,
            OverdueMinutes = overdueMinutes,
            OverdueDisplay = FormatOverdueTime(overdueMinutes),
            TotalAmount = totalAmount,
            PaymentId = payment.Id,
            PaymentAmount = totalAmount,
            PaymentMethod = request.PaymentMethod,
            QrUrl = qrUrl,
            HoldMinutes = holdMins,
            ExpiresAtUtc = isCashPayment
                ? DateTime.UtcNow
                : payment.PaymentCreatedAt.AddMinutes(holdMins),
            CreatedAt = order.CreatedAt,
        };
    }

    public async Task<OrderResponse> GetOrderByIdAsync(Guid orderId)
    {
        var order = await _context
            .Orders.Include(x => x.Booking)
            .ThenInclude(x => x.Court)
            .Include(x => x.Customer)
            .Include(x => x.Payments)
            .Include(x => x.Booking)
            .ThenInclude(x => x.BookingCourtOccurrences)
            .ThenInclude(x => x.BookingOrderItems)
            .ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.Id == orderId);

        if (order == null)
        {
            throw new ApiException("Không tìm thấy đơn hàng", HttpStatusCode.BadRequest);
        }

        return _mapper.Map<OrderResponse>(order);
    }

    public async Task<List<OrderResponse>> GetOrdersByBookingIdAsync(Guid bookingId)
    {
        var orders = await _context
            .Orders.Include(x => x.Booking)
            .ThenInclude(x => x.Court)
            .Include(x => x.Customer)
            .Include(x => x.Payments)
            .Include(x => x.Booking)
            .ThenInclude(x => x.BookingCourtOccurrences)
            .ThenInclude(x => x.BookingOrderItems)
            .ThenInclude(x => x.Product)
            .Where(x => x.BookingId == bookingId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<OrderResponse>>(orders);
    }

    public async Task<bool> ConfirmPaymentAsync(Guid orderId)
    {
        var order = await _context
            .Orders.Include(x => x.Payments)
            .Include(x => x.Booking)
            .ThenInclude(x => x.Court)
            .FirstOrDefaultAsync(x => x.Id == orderId);

        if (order == null)
        {
            throw new ApiException("Không tìm thấy đơn hàng", HttpStatusCode.BadRequest);
        }

        if (order.Status != OrderStatus.Pending)
        {
            throw new ApiException(
                "Đơn hàng không ở trạng thái chờ thanh toán",
                HttpStatusCode.BadRequest
            );
        }

        // Cập nhật trạng thái order và payment
        order.Status = OrderStatus.Paid;
        foreach (var payment in order.Payments)
        {
            payment.Status = "Paid";
        }

        // Cập nhật trạng thái booking và court khi xác nhận thanh toán
        if (order.Booking != null)
        {
            order.Booking.Status = "Completed";
            if (order.Booking.Court != null)
            {
                order.Booking.Court.Status = "Active";
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

        return Math.Round(total, 2);
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

        return Math.Round(total, 2);
    }

    private async Task<(int overdueMinutes, decimal lateFeeAmount)> CalculateLateFeeAsync(
        BookingCourtOccurrence occurrence,
        decimal lateFeePercentage
    )
    {
        var now = DateTime.Now;
        var actualEndTime = new DateTime(
            occurrence.Date.Year,
            occurrence.Date.Month,
            occurrence.Date.Day,
            occurrence.EndTime.Hour,
            occurrence.EndTime.Minute,
            occurrence.EndTime.Second
        );

        var overdueMinutes = 0;
        var lateFeeAmount = 0m;

        // Chỉ tính phí muộn nếu occurrence đang CheckedIn và hiện tại > thời gian kết thúc
        if (
            string.Equals(occurrence.Status, "CheckedIn", StringComparison.OrdinalIgnoreCase)
            && now > actualEndTime
        )
        {
            overdueMinutes = (int)Math.Round((now - actualEndTime).TotalMinutes);
            overdueMinutes = Math.Max(0, overdueMinutes);

            // Chỉ tính phí nếu muộn > 15 phút
            if (overdueMinutes > 15)
            {
                var chargeableMinutes = overdueMinutes - 15; // Chỉ tính phí cho phần muộn > 15 phút

                // Tính giá cơ bản từ giá lúc đặt sân (theo phút)
                var totalMinutes = (occurrence.EndTime - occurrence.StartTime).TotalMinutes;
                var bookingAmount = await CalculateBookingAmountForEntityAsync(
                    occurrence.BookingCourt!
                );
                var baseMinuteRate = bookingAmount / (decimal)totalMinutes;

                // Áp dụng phần trăm phí muộn (mặc định 150%)
                var lateFeeRate = baseMinuteRate * (lateFeePercentage / 100m);
                lateFeeAmount = Math.Ceiling((decimal)chargeableMinutes * lateFeeRate);
            }
            else
            {
                lateFeeAmount = 0m;
            }
        }
        else
        {
            overdueMinutes = 0;
            lateFeeAmount = 0m;
        }

        return (overdueMinutes, lateFeeAmount);
    }

    private static int GetCustomDayOfWeek(DateOnly date)
    {
        var sys = (int)date.DayOfWeek; // Sunday=0..Saturday=6
        return sys == 0 ? 8 : sys + 1; // Monday=2..Sunday=8
    }

    private static string FormatOverdueTime(int overdueMinutes)
    {
        if (overdueMinutes <= 0)
            return "0 phút";

        if (overdueMinutes >= 60)
        {
            var hours = Math.Floor(overdueMinutes / 60.0);
            var minutes = overdueMinutes % 60;
            return $"{hours} giờ {minutes} phút";
        }

        return $"{overdueMinutes} phút";
    }
}
