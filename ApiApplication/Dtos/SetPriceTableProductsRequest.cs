using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos;

public class SetPriceTableProductsRequest
{
    [Required]
    public int PriceTableId { get; set; }

    [Required]
    public List<SetPriceTableProductItem> Items { get; set; } = new();
}

public class SetPriceTableProductItem
{
    public required int ProductId { get; set; }
    public decimal? OverrideSalePrice { get; set; }
}

public class ListPriceTableProductsResponse
{
    public int PriceTableId { get; set; }
    public List<PriceTableProductItem> Items { get; set; } = new();
}

public class PriceTableProductItem
{
    public required int ProductId { get; set; }
    public decimal? OverrideSalePrice { get; set; }
}
