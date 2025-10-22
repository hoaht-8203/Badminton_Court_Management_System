using System.Collections.Generic;

namespace ApiApplication.Dtos.PriceTable;

public class ListPriceTableProductsResponse
{
    public required int PriceTableId { get; set; }
    public required string PriceTableName { get; set; }
    public List<PriceTableProductDto> Products { get; set; } = new();
}
