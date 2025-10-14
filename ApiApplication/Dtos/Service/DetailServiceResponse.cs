using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Service;

public class DetailServiceResponse : BaseEntity
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal PricePerHour { get; set; }
    public string? Category { get; set; }
    public string? Unit { get; set; }
    public int? StockQuantity { get; set; }
    public string? Note { get; set; }
}
