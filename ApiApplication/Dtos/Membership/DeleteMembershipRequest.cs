using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Membership;

public class DeleteMembershipRequest
{
    [Required]
    public int Id { get; set; }
}
