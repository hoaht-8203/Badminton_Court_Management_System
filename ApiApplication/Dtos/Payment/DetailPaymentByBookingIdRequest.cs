namespace ApiApplication.Dtos.Payment;

public class DetailPaymentByBookingIdRequest
{
    public required Guid BookingId { get; set; }
}
