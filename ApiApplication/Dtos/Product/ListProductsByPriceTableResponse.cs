using System;

namespace ApiApplication.Dtos.Product;

public class ListProductsByPriceTableResponse
{
    public required int Id { get; set; }
    public string? Code { get; set; }
    public required string Name { get; set; }
    public string? Category { get; set; }
    public string? MenuType { get; set; }
    public decimal SalePrice { get; set; }
    public decimal? OverrideSalePrice { get; set; }
    public decimal FinalPrice { get; set; }
    public bool IsDirectSale { get; set; }
    public bool IsActive { get; set; }
    public string[] Images { get; set; } = [];
    public string? Unit { get; set; }
    public int Stock { get; set; }
    public bool IsPriceOverridden { get; set; }
}
