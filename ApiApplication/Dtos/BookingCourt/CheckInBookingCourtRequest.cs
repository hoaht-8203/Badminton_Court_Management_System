namespace ApiApplication.Dtos.BookingCourt;

public class CheckInBookingCourtRequest
{
    public required Guid Id { get; set; }
    public string? Note { get; set; }
}
