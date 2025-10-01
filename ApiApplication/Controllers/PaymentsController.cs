using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Entities.Shared;
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
        public int id { get; set; }
        public string? gateway { get; set; }
        public string? transactionDate { get; set; }
        public string? accountNumber { get; set; }
        public string? code { get; set; }
        public string? content { get; set; }
        public string? transferType { get; set; }
        public long transferAmount { get; set; }
        public long accumulated { get; set; }
        public string? subAccount { get; set; }
        public string? referenceCode { get; set; }
        public string? description { get; set; }
    }

    [HttpPost("sepay/webhook")]
    [IgnoreAntiforgeryToken]
    [Consumes("application/json")]
    public async Task<ActionResult<ApiResponse<object?>>> SePayWebhook(
        [FromBody] SePayWebhookRequest request
    )
    {
        var header = Request.Headers["Authorization"].ToString();
        var expected = $"Apikey {Environment.GetEnvironmentVariable("SEPAY_API_KEY")}";
        if (
            string.IsNullOrWhiteSpace(header)
            || !string.Equals(header, expected, StringComparison.Ordinal)
        )
        {
            return StatusCode(
                (int)HttpStatusCode.Unauthorized,
                ApiResponse<object?>.ErrorResponse("Unauthorized")
            );
        }

        var probe = (request.content ?? request.description ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(probe))
        {
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Ignored: no content"));
        }

        // Prefer PM- prefix for Payment Ids, fallback to raw probe
        var paymentId =
            probe
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .FirstOrDefault(s => s.StartsWith("PM-")) ?? probe;

        var payment = await _context
            .Payments.Include(i => i.Booking)
            .FirstOrDefaultAsync(i => i.Id == paymentId);
        if (payment == null)
        {
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Ignored: payment not found"));
        }

        if (
            string.Equals(request.transferType, "in", StringComparison.OrdinalIgnoreCase)
            && request.transferAmount >= (long)Math.Round(payment.Amount, 0)
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
