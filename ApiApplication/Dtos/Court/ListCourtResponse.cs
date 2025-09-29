using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Court;

public class ListCourtResponse : BaseEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? ImageUrl { get; set; }
    public int CourtAreaId { get; set; }
    public required string CourtAreaName { get; set; }
    public CourtPricingRuleDto[] CourtPricingRules { get; set; } = [];
    public string? Note { get; set; }
    public string? Status { get; set; }
}
