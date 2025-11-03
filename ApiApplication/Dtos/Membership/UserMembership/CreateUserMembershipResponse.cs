namespace ApiApplication.Dtos.Membership.UserMembership;

public class CreateUserMembershipResponse
{
    public int UserMembershipId { get; set; }
    public int CustomerId { get; set; }
    public int MembershipId { get; set; }
    public string Status { get; set; } = string.Empty; // PendingPayment | Paid | Cancelled
    public bool IsActive { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // Payment info (useful for transfer method)
    public string PaymentId { get; set; } = string.Empty;
    public decimal PaymentAmount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // Cash | Bank
    public string QrUrl { get; set; } = string.Empty;
    public int HoldMinutes { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
}
