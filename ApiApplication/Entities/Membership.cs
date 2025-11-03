using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Membership : BaseEntity, IAuditableEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    // decimal(18,2) configured in DbContext
    public decimal Price { get; set; }

    // decimal(5,2) configured in DbContext
    public decimal DiscountPercent { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    public int DurationDays { get; set; }

    [MaxLength(50)]
    public required string Status { get; set; } = "Active";

    public ICollection<UserMembership> UserMemberships { get; set; } = new List<UserMembership>();
}
