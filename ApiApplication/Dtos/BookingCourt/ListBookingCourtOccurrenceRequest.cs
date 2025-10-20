namespace ApiApplication.Dtos.BookingCourt;

public class ListBookingCourtOccurrenceRequest
{
    public int? CustomerId { get; set; }
    public Guid? CourtId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? Status { get; set; }
}
