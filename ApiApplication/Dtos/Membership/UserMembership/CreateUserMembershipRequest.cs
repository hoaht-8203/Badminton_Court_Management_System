using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Membership.UserMembership;

public class CreateUserMembershipRequest
{
    [Required]
    public int CustomerId { get; set; }

    [Required]
    public int MembershipId { get; set; }

    public bool? IsActive { get; set; }

    public string? PaymentMethod { get; set; } // "Cash" | "Bank"
    public string? PaymentNote { get; set; }
}
