using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Membership.UserMembership;

public class CreateUserMembershipForCurrentUserRequest
{
    [Required]
    public int MembershipId { get; set; }

    public bool? IsActive { get; set; }

    public string? PaymentNote { get; set; }
}
