namespace ApiApplication.Dtos.Payment;

public class CreatePaymentForMembershipRequest
{
    public required int UserMembershipId { get; set; }
    public required int CustomerId { get; set; }
    public required decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Bank"; // Cash | Bank
    public string? Note { get; set; }
}
