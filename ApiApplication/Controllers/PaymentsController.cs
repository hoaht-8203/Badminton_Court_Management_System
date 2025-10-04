using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Controllers;

[Route("api/payment-webhooks")]
[ApiController]
public class PaymentWebhooksController(ApplicationDbContext context, IConfiguration configuration, IHubContext<BookingHub> hubContext)
    : ControllerBase
{
    private readonly ApplicationDbContext _context = context;
    private readonly IConfiguration _configuration = configuration;
    private readonly IHubContext<BookingHub> _hubContext = hubContext;

    public class SePayWebhookRequest
    {
        public int Id { get; set; }
        public string? Gateway { get; set; }
        public string? TransactionDate { get; set; }
        public string? AccountNumber { get; set; }
        public string? Code { get; set; }
        public string? Content { get; set; }
        public string? TransferType { get; set; }
        public long TransferAmount { get; set; }
        public long Accumulated { get; set; }
        public string? SubAccount { get; set; }
        public string? ReferenceCode { get; set; }
        public string? Description { get; set; }
    }

    [HttpPost("sepay/webhook")]
    [IgnoreAntiforgeryToken]
    [Consumes("application/json")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object?>>> SePayWebhook(
        [FromBody] SePayWebhookRequest request
    )
    {
        var header = Request.Headers.Authorization.ToString();
        var expected = string.Empty;
        if (_configuration.GetValue<bool>("IsDevelopment"))
        {
            expected = $"Apikey {_configuration.GetValue<string>("SEPAY_API_KEY")}";
        }
        else
        {
            expected = $"Apikey {Environment.GetEnvironmentVariable("SEPAY_API_KEY")}";
        }

        if (
            string.IsNullOrWhiteSpace(header)
            || !string.Equals(header, expected, StringComparison.Ordinal)
        )
        {
            throw new ApiException("Không có quyền truy cập", HttpStatusCode.Unauthorized);
        }

        var probe = (request.Content ?? request.Description ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(probe))
        {
            throw new ApiException("Không có nội dung", HttpStatusCode.BadRequest);
        }

        // Extract Payment ID from content - handle both PM- and PM formats
        var rawPaymentId =
            probe
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .FirstOrDefault(s => s.StartsWith("PM-") || s.StartsWith("PM")) ?? probe;

        // Transform webhook format (PM02102025000001) to database format (PM-02102025-000001)
        var paymentId = rawPaymentId;
        if (
            rawPaymentId.StartsWith("PM")
            && !rawPaymentId.StartsWith("PM-")
            && rawPaymentId.Length >= 15
        )
        {
            // Format: PM + DDMMYYYY + 000001 -> PM- + DDMMYYYY + - + 000001
            var datePart = rawPaymentId.Substring(2, 8); // DDMMYYYY
            var sequencePart = rawPaymentId.Substring(10); // 000001
            paymentId = $"PM-{datePart}-{sequencePart}";
        }

        var payment =
            await _context
                .Payments.Include(i => i.Booking)
                .FirstOrDefaultAsync(i => i.Id == paymentId)
            ?? throw new ApiException("Không tìm thấy thanh toán", HttpStatusCode.BadRequest);

        if (
            string.Equals(request.TransferType, "in", StringComparison.OrdinalIgnoreCase)
            && request.TransferAmount >= (long)Math.Round(payment.Amount, 0)
        )
        {
            payment.Status = PaymentStatus.Paid;

            if (payment.Booking != null)
            {
                if (payment.Booking.Status == BookingCourtStatus.PendingPayment)
                {
                    payment.Booking.Status = BookingCourtStatus.Active;
                }
                else if (payment.Booking.Status == BookingCourtStatus.Cancelled)
                {
                    payment.Note =
                        "Người dùng đã thanh toán sau khi đặt sân đã hủy bỏ hoặc hết hạn";
                }
            }

            await _context.SaveChangesAsync();

            // Send realtime notifications
            await _hubContext.Clients.All.SendAsync("paymentUpdated", payment.Id);
            if (payment.Booking != null)
            {
                await _hubContext.Clients.All.SendAsync("bookingUpdated", payment.Booking.Id);
            }

            return Ok(ApiResponse<object?>.SuccessResponse(null, "Thanh toán đã được xác nhận"));
        }

        return Ok(
            ApiResponse<object?>.SuccessResponse(null, "Không có nội dung hoặc số tiền không đủ")
        );
    }
}
