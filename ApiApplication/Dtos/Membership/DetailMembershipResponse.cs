namespace ApiApplication.Dtos.Membership;

public class DetailMembershipResponse
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public decimal Price { get; set; }
    public decimal DiscountPercent { get; set; }
    public string? Description { get; set; }
    public int DurationDays { get; set; }
    public string? Status { get; set; }
}
