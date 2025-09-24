using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class CourtPricingRuleTemplate : BaseEntity
{
    public Guid Id { get; set; }
    public required int[] DaysOfWeek { get; set; } = [];
    public required TimeOnly StartTime { get; set; }
    public required TimeOnly EndTime { get; set; }
    public required decimal PricePerHour { get; set; }
}
