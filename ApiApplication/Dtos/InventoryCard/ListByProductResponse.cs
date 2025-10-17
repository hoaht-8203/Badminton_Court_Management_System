namespace ApiApplication.Dtos.InventoryCard;

public class ListByProductResponse
{
    public string Code { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
    public decimal CostPrice { get; set; }
    public int QuantityChange { get; set; }
    public int EndingStock { get; set; }
}
