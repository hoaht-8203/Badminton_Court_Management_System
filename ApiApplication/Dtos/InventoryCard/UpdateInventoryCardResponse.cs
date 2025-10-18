using System;

namespace ApiApplication.Dtos.InventoryCard;

public class UpdateInventoryCardResponse
{
    public required int Id { get; set; }
    public required int ProductId { get; set; }
    public required string ProductName { get; set; }
    public required string Code { get; set; }
    public required string Method { get; set; }
    public required DateTime OccurredAt { get; set; }
    public required decimal CostPrice { get; set; }
    public required int QuantityChange { get; set; }
    public required int EndingStock { get; set; }
    public string? Note { get; set; }
}
