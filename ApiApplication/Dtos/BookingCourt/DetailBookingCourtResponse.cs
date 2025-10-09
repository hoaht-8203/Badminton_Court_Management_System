namespace ApiApplication.Dtos.BookingCourt;

public class DetailBookingCourtResponse
{
    public Guid Id { get; set; }
    public int CustomerId { get; set; }
    public Guid CourtId { get; set; }
    public string? CourtName { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int[]? DaysOfWeek { get; set; }
    public string? Status { get; set; }
    public decimal TotalHours { get; set; }

    // Extra info
    public ApiApplication.Dtos.Customer.CustomerDto Customer { get; set; } = null!;
    public List<ApiApplication.Dtos.Payment.PaymentDto> Payments { get; set; } = [];

    // Payment summary
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public string? PaymentType { get; set; } // Deposit | Full | None

    // Inline QR/payment info for quick checkout (when transfer method)
    public string? PaymentId { get; set; }
    public decimal? PaymentAmount { get; set; }
    public string? QrUrl { get; set; }
    public int? HoldMinutes { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
}
