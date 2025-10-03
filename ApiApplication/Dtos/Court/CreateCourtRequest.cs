using System;

namespace ApiApplication.Dtos.Court;

public class CreateCourtRequest
{
    public required string Name { get; set; }
    public string? ImageUrl { get; set; }
    public required int CourtAreaId { get; set; }
    public string? Note { get; set; }
    public required CreateCourtPricingRulesRequest[] CourtPricingRules { get; set; }
}

public class CreateCourtPricingRulesRequest
{
    public required int[] DaysOfWeek { get; set; }
    public required TimeOnly StartTime { get; set; }
    public required TimeOnly EndTime { get; set; }
    public required decimal PricePerHour { get; set; }
    public required int Order { get; set; }
}
