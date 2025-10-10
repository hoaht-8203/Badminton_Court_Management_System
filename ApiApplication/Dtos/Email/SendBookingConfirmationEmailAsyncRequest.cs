namespace ApiApplication.Dtos.Email;

public class SendBookingConfirmationEmailAsyncRequest
{
    public string To { get; set; } = string.Empty;
    public string? ToName { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CourtName { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string PaidAmount { get; set; } = string.Empty;
}
