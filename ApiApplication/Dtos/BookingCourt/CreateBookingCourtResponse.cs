namespace ApiApplication.Dtos.BookingCourt;

public class CreateBookingCourtResponse
{
    public Guid Id { get; set; }
    public string? CourtName { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int[]? DaysOfWeek { get; set; }
    public string? Status { get; set; }

    // Customer info (minimal for QR drawer display)
    public CustomerInfo Customer { get; set; } = null!;

    // Payment info (only populated for Bank payment method)
    public string? PaymentId { get; set; }
    public decimal? PaymentAmount { get; set; }
    public string? QrUrl { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }

    public class CustomerInfo
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }
}
