namespace ApiApplication.Dtos.Membership.UserMembership;

public class ListUserMembershipRequest
{
    public int? CustomerId { get; set; }
    public int? MembershipId { get; set; }
    public bool? IsActive { get; set; }
}
