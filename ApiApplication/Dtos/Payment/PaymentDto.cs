using System;

namespace ApiApplication.Dtos.Payment;

public class PaymentDto
{
    public string Id { get; set; } = string.Empty;
    public Guid BookingId { get; set; }
    public DateTime PaymentCreatedAt { get; set; }
    public decimal Amount { get; set; }
    public string? Status { get; set; }

    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }

    public Guid CourtId { get; set; }
    public string CourtName { get; set; } = string.Empty;
    public string? Note { get; set; }
}
