namespace ApiApplication.Dtos.BookingCourt;

public class ListBookingCourtRequest
{
	public int? CustomerId { get; set; }
	public Guid? CourtId { get; set; }
	public DateOnly? FromDate { get; set; }
	public DateOnly? ToDate { get; set; }
}


