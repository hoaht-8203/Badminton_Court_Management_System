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

    public async Task<CheckoutResponse> GetCheckoutInfoAsync(Guid orderId)
    {
        var order = await _context
            .Orders.Include(x => x.Booking)
            .ThenInclude(x => x!.Court)
            .Include(x => x.Booking)
            .ThenInclude(x => x!.Customer)
            .Include(x => x.Payments)
            .Include(x => x.BookingCourtOccurrence)
            .ThenInclude(x => x!.BookingOrderItems)
            .ThenInclude(x => x.Product)
            .Include(x => x.BookingCourtOccurrence)
            .ThenInclude(x => x!.BookingServices)
            .ThenInclude(x => x.Service)
            .FirstOrDefaultAsync(x => x.Id == orderId);

        if (order == null)
        {
            throw new ApiException("Không tìm thấy đơn hàng", HttpStatusCode.BadRequest);
        }

        // Tạo QR URL cho thanh toán (chỉ khi thanh toán chuyển khoản)
        string qrUrl = string.Empty;
        var holdMins = 0;

        var isCashPayment = string.Equals(
            order.PaymentMethod,
            "Cash",
            StringComparison.OrdinalIgnoreCase
        );

        if (!isCashPayment && order.TotalAmount > 0)
        {
            var acc = Environment.GetEnvironmentVariable("SEPAY_ACC") ?? "VQRQAEMLF5363";
            var bank = Environment.GetEnvironmentVariable("SEPAY_BANK") ?? "MBBank";
            var amount = ((long)Math.Ceiling(order.TotalAmount)).ToString();
            var des = Uri.EscapeDataString(order.Id.ToString());
            qrUrl = $"https://qr.sepay.vn/img?acc={acc}&bank={bank}&amount={amount}&des={des}";
            holdMins = _configuration.GetValue<int?>("Booking:HoldMinutes") ?? 15;
        }

        return new CheckoutResponse
        {
            OrderId = order.Id,
            OrderCode = order.OrderCode,
            BookingId = order.BookingId,
            BookingCourtOccurrenceId = order.BookingCourtOccurrenceId ?? Guid.Empty,
            CustomerId = order.CustomerId,
            CustomerName = order.Booking?.Customer?.FullName ?? string.Empty,
            CourtName = order.Booking?.Court?.Name ?? string.Empty,
            CourtTotalAmount = order.CourtTotalAmount,
            CourtPaidAmount = order.CourtPaidAmount,
            CourtRemainingAmount = order.CourtRemainingAmount,
            ItemsSubtotal = order.ItemsSubtotal,
            ServicesSubtotal = order.ServicesSubtotal,
            LateFeePercentage = order.LateFeePercentage,
            LateFeeAmount = order.LateFeeAmount,
            OverdueMinutes = order.OverdueMinutes,
            OverdueDisplay = FormatOverdueTime(order.OverdueMinutes),
            TotalAmount = order.TotalAmount,
            PaymentId = order.Payments.FirstOrDefault()?.Id ?? string.Empty,
            PaymentAmount = order.TotalAmount,
            PaymentMethod = order.PaymentMethod,
            QrUrl = qrUrl,
            HoldMinutes = holdMins,
            ExpiresAtUtc =
                order.Payments.FirstOrDefault()?.PaymentCreatedAt.AddMinutes(holdMins)
                ?? DateTime.UtcNow,
            CreatedAt = order.CreatedAt,
        };
    }

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

        var courtRemainingAmount = Math.Max(
            0,
            Math.Ceiling(courtTotalAmount - paidAmountPerOccurrence)
        );

        // Tính toán tổng tiền món hàng từ occurrence cụ thể
        var itemsSubtotal = occurrence.BookingOrderItems?.Sum(x => x.TotalPrice) ?? 0m;

        // Tính toán tổng tiền dịch vụ từ occurrence cụ thể
        var servicesSubtotal = await CalculateServicesSubtotalAsync(occurrence);

        // Tính toán phí muộn
        var lateFeeResult = await CalculateLateFeeAsync(occurrence, request.LateFeePercentage);
        var overdueMinutes = lateFeeResult.overdueMinutes;
        var lateFeeAmount = lateFeeResult.lateFeeAmount;

        // Tổng thanh toán
        var totalAmount = Math.Ceiling(
            courtRemainingAmount + itemsSubtotal + servicesSubtotal + lateFeeAmount
        );

        // Xác định trạng thái order và payment dựa trên phương thức thanh toán
        var isCashPayment = string.Equals(
            request.PaymentMethod,
            "Cash",
            StringComparison.OrdinalIgnoreCase
        );
        var orderStatus = isCashPayment ? OrderStatus.Paid : OrderStatus.Pending;
        var paymentStatus = isCashPayment ? "Paid" : "PendingPayment";

        // Tạo Order
        var orderCode = await GenerateOrderCodeAsync();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = orderCode,
            BookingId = booking.Id,
            BookingCourtOccurrenceId = occurrence.Id,
            CustomerId = booking.CustomerId,
            CourtTotalAmount = courtTotalAmount,
            CourtPaidAmount = paidAmountPerOccurrence,
            CourtRemainingAmount = courtRemainingAmount,
            ItemsSubtotal = itemsSubtotal,
            ServicesSubtotal = servicesSubtotal,
            LateFeePercentage = request.LateFeePercentage,
            LateFeeAmount = lateFeeAmount,
            OverdueMinutes = overdueMinutes,
            TotalAmount = totalAmount,
            Status = orderStatus,
            PaymentMethod = request.PaymentMethod,
            Note = request.Note,
        };

        await _context.Orders.AddAsync(order);
        await _context.SaveChangesAsync();

        // Calculate and update service costs based on actual usage time
        await CalculateAndUpdateServiceCostsAsync(occurrence);

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

        if (!isCashPayment && totalAmount > 0)
        {
            var acc = Environment.GetEnvironmentVariable("SEPAY_ACC") ?? "VQRQAEMLF5363";
            var bank = Environment.GetEnvironmentVariable("SEPAY_BANK") ?? "MBBank";
            var amount = ((long)Math.Ceiling(totalAmount)).ToString();
            var des = Uri.EscapeDataString(order.Id.ToString());
            qrUrl = $"https://qr.sepay.vn/img?acc={acc}&bank={bank}&amount={amount}&des={des}";
            holdMins = _configuration.GetValue<int?>("Booking:HoldMinutes") ?? 15;

            System.Console.WriteLine($"QR URL created: {qrUrl}");
        }
        else
        {
            System.Console.WriteLine(
                $"No QR URL - isCashPayment: {isCashPayment}, totalAmount: {totalAmount}"
            );
        }

        return new CheckoutResponse
        {
            OrderId = order.Id,
            OrderCode = order.OrderCode,
            BookingId = booking.Id,
            BookingCourtOccurrenceId = occurrence.Id,
            CustomerId = booking.CustomerId,
            CustomerName = booking.Customer?.FullName ?? string.Empty,
            CourtName = booking.Court?.Name ?? string.Empty,
            CourtTotalAmount = Math.Ceiling(courtTotalAmount),
            CourtPaidAmount = Math.Ceiling(paidAmountPerOccurrence),
            CourtRemainingAmount = Math.Ceiling(courtRemainingAmount),
            ItemsSubtotal = Math.Ceiling(itemsSubtotal),
            ServicesSubtotal = Math.Ceiling(servicesSubtotal),
            LateFeePercentage = request.LateFeePercentage,
            LateFeeAmount = Math.Ceiling(lateFeeAmount),
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
            .ThenInclude(x => x!.Court)
            .Include(x => x.Booking)
            .ThenInclude(x => x!.Customer)
            .Include(x => x.Customer)
            .Include(x => x.Payments)
            .Include(x => x.Booking)
            .ThenInclude(x => x!.BookingCourtOccurrences)
            .ThenInclude(x => x.BookingOrderItems)
            .ThenInclude(x => x.Product)
            .Include(x => x.Booking)
            .ThenInclude(x => x!.BookingCourtOccurrences)
            .ThenInclude(x => x.BookingServices)
            .ThenInclude(x => x.Service)
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
            .ThenInclude(x => x!.Court)
            .Include(x => x.Booking)
            .ThenInclude(x => x!.Customer)
            .Include(x => x.Customer)
            .Include(x => x.Payments)
            .Include(x => x.Booking)
            .ThenInclude(x => x!.BookingCourtOccurrences)
            .ThenInclude(x => x.BookingOrderItems)
            .ThenInclude(x => x.Product)
            .Include(x => x.Booking)
            .ThenInclude(x => x!.BookingCourtOccurrences)
            .ThenInclude(x => x.BookingServices)
            .ThenInclude(x => x.Service)
            .Where(x => x.BookingId == bookingId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<OrderResponse>>(orders);
    }

    public async Task<List<OrderResponse>> GetPendingPaymentOrdersAsync(
        string? status = null,
        string? paymentMethod = null
    )
    {
        var query = _context
            .Orders.Include(x => x.Booking)
            .ThenInclude(x => x!.Court)
            .Include(x => x.Booking)
            .ThenInclude(x => x!.Customer)
            .Include(x => x.Customer)
            .Include(x => x.Payments)
            .Include(x => x.BookingCourtOccurrence)
            .ThenInclude(x => x!.BookingOrderItems)
            .ThenInclude(x => x.Product)
            .Include(x => x.BookingCourtOccurrence)
            .ThenInclude(x => x!.BookingServices)
            .ThenInclude(x => x.Service)
            .AsQueryable();

        // Filter by status if provided
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(x => x.Status == status);
        }

        // Filter by payment method if provided
        if (!string.IsNullOrEmpty(paymentMethod))
        {
            query = query.Where(x => x.PaymentMethod == paymentMethod);
        }

        // Order by creation time (newest first)
        var orders = await query.OrderByDescending(x => x.CreatedAt).ToListAsync();

        return _mapper.Map<List<OrderResponse>>(orders);
    }

    public async Task<List<ListOrderResponse>> GetOrdersAsync(ListOrderRequest request)
    {
        var query = _context
            .Orders.Include(x => x.Booking)
            .ThenInclude(x => x!.Court)
            .Include(x => x.Booking)
            .ThenInclude(x => x!.Customer)
            .Include(x => x.Booking)
            .ThenInclude(x => x.Court)
            .ThenInclude(x => x.CourtArea)
            .Include(x => x.Customer)
            .Include(x => x.Payments)
            .Include(x => x.BookingCourtOccurrence)
            .ThenInclude(x => x!.BookingOrderItems)
            .ThenInclude(x => x.Product)
            .Include(x => x.BookingCourtOccurrence)
            .ThenInclude(x => x!.BookingServices)
            .ThenInclude(x => x.Service)
            .AsQueryable();

        // Filter by status if provided
        if (!string.IsNullOrEmpty(request.Status))
        {
            query = query.Where(x => x.Status == request.Status);
        }

        // Filter by payment method if provided
        if (!string.IsNullOrEmpty(request.PaymentMethod))
        {
            query = query.Where(x => x.PaymentMethod == request.PaymentMethod);
        }

        // Filter by customer if provided
        if (request.CustomerId.HasValue)
        {
            query = query.Where(x => x.CustomerId == request.CustomerId.Value);
        }

        // Filter by date range if provided
        if (request.FromDate.HasValue)
        {
            query = query.Where(x => x.CreatedAt.Date >= request.FromDate.Value.Date);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(x => x.CreatedAt.Date <= request.ToDate.Value.Date);
        }

        // Order by creation time (newest first)
        var orders = await query.OrderByDescending(x => x.CreatedAt).ToListAsync();

        return _mapper.Map<List<ListOrderResponse>>(orders);
    }

    public async Task<bool> ExtendPaymentTimeAsync(Guid orderId)
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

        // Chỉ cho phép extend payment cho orders có status Cancelled
        if (order.Status != OrderStatus.Cancelled)
        {
            throw new ApiException(
                "Chỉ có thể gia hạn thanh toán cho đơn hàng đã bị hủy",
                HttpStatusCode.BadRequest
            );
        }

        // Cập nhật trạng thái order về Pending
        order.Status = OrderStatus.Pending;

        // Cập nhật trạng thái payment về PendingPayment và reset thời gian
        foreach (var payment in order.Payments)
        {
            payment.Status = "PendingPayment";
            payment.PaymentCreatedAt = DateTime.UtcNow; // Reset thời gian tạo payment
        }

        // Cập nhật trạng thái booking và court về CheckedIn để có thể tiếp tục chơi
        if (order.Booking != null)
        {
            order.Booking.HoldExpiresAtUtc = DateTime.UtcNow.AddMinutes(5);
        }

        await _context.SaveChangesAsync();
        return true;
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
            occurrence.EndTime.Second,
            DateTimeKind.Local
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

                // Tính giá cơ bản từ occurrence cụ thể (giống BookingCourtService)
                var totalMinutes = (occurrence.EndTime - occurrence.StartTime).TotalMinutes;
                var occurrenceAmount = await CalculateBookingAmountForOccurrenceAsync(occurrence);
                var baseMinuteRate = occurrenceAmount / (decimal)totalMinutes;

                // Apply late fee percentage (giống BookingCourtService)
                var lateFeeRate = baseMinuteRate * (lateFeePercentage / 100m);
                var surchargeAmount = Math.Ceiling(chargeableMinutes * lateFeeRate);

                // Làm tròn lên hàng nghìn (giống BookingCourtService)
                lateFeeAmount = Math.Ceiling(surchargeAmount / 1000m) * 1000m;
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

    private async Task CalculateAndUpdateServiceCostsAsync(BookingCourtOccurrence occurrence)
    {
        var now = DateTime.UtcNow;
        var bookingServices = await _context
            .BookingServices.Include(bs => bs.Service)
            .Where(bs => bs.BookingCourtOccurrenceId == occurrence.Id)
            .ToListAsync();

        // Group by service to avoid duplicate stock updates
        var serviceStockUpdates = new Dictionary<Guid, int>();

        foreach (var bookingService in bookingServices)
        {
            // Nếu dịch vụ đã hoàn thành, không cập nhật gì thêm
            if (bookingService.Status == "Completed")
            {
                // Vẫn cần cập nhật stock cho các dịch vụ đã hoàn thành
                if (bookingService.Service.StockQuantity.HasValue)
                {
                    if (serviceStockUpdates.ContainsKey(bookingService.ServiceId))
                    {
                        serviceStockUpdates[bookingService.ServiceId] += bookingService.Quantity;
                    }
                    else
                    {
                        serviceStockUpdates[bookingService.ServiceId] = bookingService.Quantity;
                    }
                }
                continue;
            }

            // Chỉ cập nhật các dịch vụ chưa hoàn thành
            // Calculate actual usage time in hours
            var usageTime = now - bookingService.ServiceStartTime;
            var usageHours = (decimal)usageTime.TotalHours;

            // Update service end time
            bookingService.ServiceEndTime = now;

            // Calculate raw cost based on actual usage time
            var rawCost = bookingService.Quantity * bookingService.UnitPrice * usageHours;

            // Round up to nearest 1000 for billing (same logic as frontend)
            bookingService.Hours = Math.Ceiling(usageHours); // Keep for reference
            bookingService.TotalPrice = Math.Ceiling(rawCost / 1000m) * 1000m;
            bookingService.Status = "Completed"; // Mark as completed during checkout

            // Accumulate stock return quantities by service
            if (bookingService.Service.StockQuantity.HasValue)
            {
                if (serviceStockUpdates.ContainsKey(bookingService.ServiceId))
                {
                    serviceStockUpdates[bookingService.ServiceId] += bookingService.Quantity;
                }
                else
                {
                    serviceStockUpdates[bookingService.ServiceId] = bookingService.Quantity;
                }
            }
        }

        // Apply stock updates to services
        foreach (var stockUpdate in serviceStockUpdates)
        {
            var service = await _context.Services.FindAsync(stockUpdate.Key);
            if (service != null && service.StockQuantity.HasValue)
            {
                service.StockQuantity += stockUpdate.Value;
            }
        }

        await _context.SaveChangesAsync();
    }

    private async Task<decimal> CalculateServicesSubtotalAsync(BookingCourtOccurrence occurrence)
    {
        var now = DateTime.UtcNow;
        var bookingServices = await _context
            .BookingServices.Where(bs => bs.BookingCourtOccurrenceId == occurrence.Id)
            .ToListAsync();

        var totalServicesCost = 0m;

        foreach (var bookingService in bookingServices)
        {
            // Nếu dịch vụ đã hoàn thành, sử dụng TotalPrice tĩnh
            if (bookingService.Status == "Completed" && bookingService.TotalPrice > 0)
            {
                totalServicesCost += bookingService.TotalPrice;
                continue;
            }

            // Nếu dịch vụ chưa hoàn thành, tính toán real-time
            var usageTime = now - bookingService.ServiceStartTime;
            var usageHours = (decimal)usageTime.TotalHours;

            // Calculate raw cost based on actual usage time
            var rawCost = bookingService.Quantity * bookingService.UnitPrice * usageHours;

            // Round up to nearest 1000 (same logic as frontend)
            var serviceCost = Math.Ceiling(rawCost / 1000m) * 1000m;
            totalServicesCost += serviceCost;
        }

        return totalServicesCost;
    }

    private async Task<string> GenerateOrderCodeAsync()
    {
        var today = DateTime.Now;
        var datePrefix = today.ToString("ddMMyyyy");
        var prefix = $"DH{datePrefix}";

        // Tìm số thứ tự cao nhất trong ngày
        var maxOrderCode = await _context
            .Orders.Where(o => o.OrderCode.StartsWith(prefix))
            .Select(o => o.OrderCode)
            .OrderByDescending(code => code)
            .FirstOrDefaultAsync();

        int nextSequence = 1;
        if (!string.IsNullOrEmpty(maxOrderCode))
        {
            var lastSequenceStr = maxOrderCode.Substring(prefix.Length + 1); // +1 for the dash
            if (int.TryParse(lastSequenceStr, out int lastSequence))
            {
                nextSequence = lastSequence + 1;
            }
        }

        return $"{prefix}-{nextSequence:D6}";
    }
}
