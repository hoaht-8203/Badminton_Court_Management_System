namespace ApiApplication.Dtos.BookingCourt;

public class CancelBookingCourtOccurrenceRequest
{
    public required Guid Id { get; set; }
    public string? Note { get; set; }
}

