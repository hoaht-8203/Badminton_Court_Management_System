using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Membership;

public class CreateMembershipRequest
{
    [Required]
    [MaxLength(100)]
    public string? Name { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    [Range(0, 100)]
    public decimal DiscountPercent { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Range(1, int.MaxValue)]
    public int DurationDays { get; set; }

    [MaxLength(50)]
    public string? Status { get; set; }
}
