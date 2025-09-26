using System;

namespace ApiApplication.Dtos.Court;

public class UpdateCourtPricingRuleTemplateRequest
{
    public Guid Id { get; set; }
    public required int[] DaysOfWeek { get; set; }
    public required TimeOnly StartTime { get; set; }
    public required TimeOnly EndTime { get; set; }
    public required decimal PricePerHour { get; set; }
}
