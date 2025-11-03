using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Membership;

public class DetailMembershipRequest
{
    [Required]
    public int Id { get; set; }
}
