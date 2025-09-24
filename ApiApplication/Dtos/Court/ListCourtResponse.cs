using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Court;

public class ListCourtResponse : BaseEntity
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? ImageUrl { get; set; }
    public int CourtAreaId { get; set; }
    public string? CourtAreaName { get; set; }
    public ListCourtPricingRulesResponse[] CourtPricingRules { get; set; } = [];
    public string? Note { get; set; }
    public string? Status { get; set; }
}
