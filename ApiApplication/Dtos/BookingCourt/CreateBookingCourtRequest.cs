namespace ApiApplication.Dtos.BookingCourt;

public class CreateBookingCourtRequest
{
    public int CustomerId { get; set; }
    public Guid CourtId { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int[]? DaysOfWeek { get; set; }
    public string? Note { get; set; }
}
