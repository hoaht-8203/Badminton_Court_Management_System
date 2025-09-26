using System;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Court : BaseEntity
{
    [Key]
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public string? ImageUrl { get; set; }

    public required int CourtAreaId { get; set; }
    public CourtArea? CourtArea { get; set; }

    public string? Note { get; set; }
    public required string Status { get; set; } = CourtStatus.Active;

    public ICollection<CourtPricingRules> CourtPricingRules { get; set; } = [];
}
