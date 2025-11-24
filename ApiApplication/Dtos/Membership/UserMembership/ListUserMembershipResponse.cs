using ApiApplication.Dtos.Customer;
using ApiApplication.Dtos.Payment;

namespace ApiApplication.Dtos.Membership.UserMembership;

public class ListUserMembershipResponse
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int MembershipId { get; set; }
    public string? MembershipName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public CustomerDto? Customer { get; set; }
    public List<PaymentDto> Payments { get; set; } = new();
    public string Status { get; set; } = string.Empty;
}
