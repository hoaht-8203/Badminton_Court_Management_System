using System;

namespace ApiApplication.Dtos.Court;

public class CourtPricingRulesResponse
{
    public Guid Id { get; set; }
    public Guid CourtId { get; set; }
    public int[] DaysOfWeek { get; set; } = [];
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public decimal PricePerHour { get; set; }
}
