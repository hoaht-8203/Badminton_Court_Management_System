namespace ApiApplication.Dtos.Payment;

public class CreatePaymentRequest
{
    public required Guid BookingId { get; set; }
}
