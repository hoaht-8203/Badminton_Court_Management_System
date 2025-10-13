namespace ApiApplication.Dtos.Service;

public class ListServiceResponse
{
    public Guid Id { get; set; }
    public string? Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? Status { get; set; }
    public int? LinkedProductId { get; set; }
    public ServicePricingRuleDto? Pricing { get; set; }
}
