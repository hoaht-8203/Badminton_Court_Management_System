using System;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class CourtPricingRules : BaseEntity
{
    [Key]
    public required Guid Id { get; set; }
    public required Guid CourtId { get; set; }
    public required Court Court { get; set; } = null!;
    public required int[] DaysOfWeek { get; set; } = [];
    public required DateTime StartTime { get; set; }
    public required DateTime EndTime { get; set; }
    public required decimal PricePerHour { get; set; }
}
