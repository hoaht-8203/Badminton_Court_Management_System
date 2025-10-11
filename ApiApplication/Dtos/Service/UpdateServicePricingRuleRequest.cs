using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Service;

public class UpdateServicePricingRuleRequest
{
    public required Guid ServiceId { get; set; }

    public required decimal PricePerHour { get; set; }
}


