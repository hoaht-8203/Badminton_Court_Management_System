using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceTable;

public class SetPriceTableProductsRequest
{
    [Required]
    public int PriceTableId { get; set; }

    [Required]
    public List<PriceTableProductItem> Products { get; set; } = new();
}
