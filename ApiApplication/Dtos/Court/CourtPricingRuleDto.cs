using System;

namespace ApiApplication.Dtos.Court;

public class CourtPricingRuleDto
{
    public Guid Id { get; set; }
    public Guid CourtId { get; set; }
    public int[] DaysOfWeek { get; set; } = [];
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public decimal PricePerHour { get; set; }
}
