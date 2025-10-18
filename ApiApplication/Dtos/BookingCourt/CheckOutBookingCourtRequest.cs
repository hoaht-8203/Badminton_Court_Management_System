namespace ApiApplication.Dtos.BookingCourt;

public class CheckOutBookingCourtRequest
{
    public required Guid Id { get; set; }
    public string? Note { get; set; }
}
