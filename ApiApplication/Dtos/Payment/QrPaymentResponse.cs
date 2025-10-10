namespace ApiApplication.Dtos.Payment;

public class QrPaymentResponse
{
    public string PaymentId { get; set; } = string.Empty;
    public string QrUrl { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public int HoldMinutes { get; set; }
}
