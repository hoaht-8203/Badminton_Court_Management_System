namespace ApiApplication.Dtos.BookingCourt;

public class ListBookingCourtRequest
{
    public int? CustomerId { get; set; }
    public Guid? CourtId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
