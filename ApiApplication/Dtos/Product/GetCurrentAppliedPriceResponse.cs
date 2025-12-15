namespace ApiApplication.Dtos.Product;

public class GetCurrentAppliedPriceResponse
{
    public int ProductId { get; set; }
    public string? ProductName { get; set; }
    public decimal SalePrice { get; set; }
    public decimal? OverrideSalePrice { get; set; }
    public decimal FinalPrice { get; set; }
    public int? PriceTableId { get; set; }
    public string? PriceTableName { get; set; }
    public bool IsPriceOverridden { get; set; }
}

