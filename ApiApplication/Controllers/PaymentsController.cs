using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Controllers;

[Route("api/payment-webhooks")]
[ApiController]
public class PaymentWebhooksController(ApplicationDbContext context) : ControllerBase
{
    private readonly ApplicationDbContext _context = context;

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
        // var expected = $"Apikey {Environment.GetEnvironmentVariable("SEPAY_API_KEY")}";
        var expected = $"Apikey 1234567890";
        if (
            string.IsNullOrWhiteSpace(header)
            || !string.Equals(header, expected, StringComparison.Ordinal)
        )
        {
            throw new ApiException("Unauthorized", HttpStatusCode.Unauthorized);
        }

        var probe = (request.Content ?? request.Description ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(probe))
        {
            throw new ApiException("Ignored: no content", HttpStatusCode.BadRequest);
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
            ?? throw new ApiException("Payment not found", HttpStatusCode.BadRequest);

        if (
            string.Equals(request.TransferType, "in", StringComparison.OrdinalIgnoreCase)
            && request.TransferAmount >= (long)Math.Round(payment.Amount, 0)
        )
        {
            payment.Status = PaymentStatus.Paid;
            if (payment.Booking != null)
            {
                payment.Booking.Status = BookingCourtStatus.Active;
            }
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Payment confirmed"));
        }

        return Ok(
            ApiResponse<object?>.SuccessResponse(
                null,
                "Ignored: not incoming or amount insufficient"
            )
        );
    }
}
