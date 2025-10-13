using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Service;

public class DeleteServicePricingRuleRequest
{
    public required Guid ServiceId { get; set; }
}
