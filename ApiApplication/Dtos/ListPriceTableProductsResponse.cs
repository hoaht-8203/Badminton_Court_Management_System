using System.Collections.Generic;

namespace ApiApplication.Dtos;

public class ListPriceTableProductsResponse
{
    public int PriceTableId { get; set; }
    public List<int> ProductIds { get; set; } = new();
    public List<PriceTableProductItem> Items { get; set; } = new();
}
