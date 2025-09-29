using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos;

public class SetPriceTableProductItem
{
    public required int ProductId { get; set; }
    public decimal? OverrideSalePrice { get; set; }
}
