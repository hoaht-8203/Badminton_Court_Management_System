namespace ApiApplication.Dtos.BookingCourt;

public class ListBookingCourtResponse
{
	public Guid Id { get; set; }
	public int CustomerId { get; set; }
	public Guid CourtId { get; set; }
	public DateOnly StartDate { get; set; }
	public DateOnly EndDate { get; set; }
	public TimeOnly StartTime { get; set; }
	public TimeOnly EndTime { get; set; }
	public int[]? DaysOfWeek { get; set; }
	public string? Status { get; set; }
}


