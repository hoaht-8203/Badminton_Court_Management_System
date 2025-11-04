using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Membership.UserMembership;

public class UpdateUserMembershipStatusRequest
{
    [Required]
    public int Id { get; set; }

    [Required]
    public bool IsActive { get; set; }
}
