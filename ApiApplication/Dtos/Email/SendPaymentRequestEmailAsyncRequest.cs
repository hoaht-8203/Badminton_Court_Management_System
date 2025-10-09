using System;

namespace ApiApplication.Dtos.Email;

public class SendPaymentRequestEmailAsyncRequest
{
    public string To { get; set; } = string.Empty;
    public string? ToName { get; set; }
    public string PaymentId { get; set; } = string.Empty;
    public string Amount { get; set; } = string.Empty;
    public string CourtName { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string QrUrl { get; set; } = string.Empty;
    public int HoldMinutes { get; set; }
}
