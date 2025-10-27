using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceTable;

public class PriceTableProductItem
{
    [Required]
    public int ProductId { get; set; }

    public decimal? OverrideSalePrice { get; set; }
}
