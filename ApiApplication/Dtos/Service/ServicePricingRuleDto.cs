using System;

namespace ApiApplication.Dtos.Service;

public class ServicePricingRuleDto
{
    public required Guid Id { get; set; }
    public required Guid ServiceId { get; set; }
    public required decimal PricePerHour { get; set; }
}
