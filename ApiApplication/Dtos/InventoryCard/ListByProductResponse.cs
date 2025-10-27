namespace ApiApplication.Dtos.InventoryCard;

public class ListByProductResponse
{
    public string? Code { get; set; }
    public string? Method { get; set; }
    public DateTime OccurredAt { get; set; }
    public decimal CostPrice { get; set; }
    public int QuantityChange { get; set; }
    public int EndingStock { get; set; }
}
