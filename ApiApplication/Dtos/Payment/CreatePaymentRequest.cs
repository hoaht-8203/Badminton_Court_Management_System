namespace ApiApplication.Dtos.Payment;

public class CreatePaymentRequest
{
    public required Guid BookingId { get; set; }
    public int CustomerId { get; set; }

    // Optional: allow client to influence payment creation
    public decimal? Amount { get; set; }
    public bool? PayInFull { get; set; }
    public decimal? DepositPercent { get; set; }
    public string? PaymentMethod { get; set; } // "Bank" | "Cash"
}
