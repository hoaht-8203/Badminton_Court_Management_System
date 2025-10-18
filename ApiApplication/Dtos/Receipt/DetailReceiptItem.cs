namespace ApiApplication.Dtos.Receipt;

public class DetailReceiptItem
{
    public int ProductId { get; set; }
    public string? ProductCode { get; set; }
    public string? ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal CostPrice { get; set; }
}
