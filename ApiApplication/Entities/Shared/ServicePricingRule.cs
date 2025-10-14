using System;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class ServicePricingRule : BaseEntity
{
    [Key]
    public required Guid Id { get; set; }

    public required Guid ServiceId { get; set; }
    public required Service Service { get; set; } = null!;

    public required decimal PricePerHour { get; set; }
}
