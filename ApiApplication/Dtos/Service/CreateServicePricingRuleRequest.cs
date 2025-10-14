using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Service;

public class CreateServicePricingRuleRequest
{
    [Required]
    public required Guid ServiceId { get; set; }

    [Required]
    public required decimal PricePerHour { get; set; }
}
