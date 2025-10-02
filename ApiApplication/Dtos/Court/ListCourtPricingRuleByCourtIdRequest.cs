using System;

namespace ApiApplication.Dtos.Court;

public class ListCourtPricingRuleByCourtIdRequest
{
    public required Guid CourtId { get; set; }
}
