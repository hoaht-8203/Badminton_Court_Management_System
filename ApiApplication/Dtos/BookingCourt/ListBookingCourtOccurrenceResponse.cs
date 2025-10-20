namespace ApiApplication.Dtos.BookingCourt;

public class ListBookingCourtOccurrenceResponse
{
    public Guid Id { get; set; }
    public Guid BookingCourtId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string Status { get; set; } = null!;
    public string? Note { get; set; }

    // BookingCourt information
    public string CustomerName { get; set; } = null!;
    public string CourtName { get; set; } = null!;
    public Guid CourtId { get; set; }
    public int CustomerId { get; set; }

    // Additional fields for frontend
    public string StartDate { get; set; } = null!; // For compatibility with frontend
    public string EndDate { get; set; } = null!; // For compatibility with frontend
}
