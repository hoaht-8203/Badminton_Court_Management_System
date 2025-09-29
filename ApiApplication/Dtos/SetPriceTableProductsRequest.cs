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
