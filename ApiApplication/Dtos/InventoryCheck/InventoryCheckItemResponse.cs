namespace ApiApplication.Dtos.InventoryCheck;

public class InventoryCheckItemResponse
{
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int SystemQuantity { get; set; }
    public int ActualQuantity { get; set; }
    public int DeltaQuantity => ActualQuantity - SystemQuantity;
    public decimal CostPrice { get; set; }
    public decimal DeltaValue => CostPrice * DeltaQuantity;
}
