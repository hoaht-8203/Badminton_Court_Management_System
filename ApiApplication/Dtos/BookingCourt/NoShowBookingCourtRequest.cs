namespace ApiApplication.Dtos.BookingCourt;

public class NoShowBookingCourtRequest
{
    public required Guid Id { get; set; }
    public string? Note { get; set; }
}
