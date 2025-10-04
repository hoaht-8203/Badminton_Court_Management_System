using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Court;

public class ListCourtPricingRuleByCourtIdResponse : BaseEntity
{
    public required Guid CourtId { get; set; }
    public required int[] DaysOfWeek { get; set; } = [];
    public required TimeOnly StartTime { get; set; }
    public required TimeOnly EndTime { get; set; }
    public required decimal PricePerHour { get; set; }
    public required int Order { get; set; }
}
