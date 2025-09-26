namespace ApiApplication.Dtos.Court;

public class DetailCourtResponse
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? ImageUrl { get; set; }
    public int CourtAreaId { get; set; }
    public string? CourtAreaName { get; set; }
    public string? Note { get; set; }
    public CourtPricingRuleDto[] CourtPricingRules { get; set; } = [];
    public string? Status { get; set; }
}
