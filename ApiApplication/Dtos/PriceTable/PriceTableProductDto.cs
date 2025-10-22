using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceTable;

public class PriceTableProductDto
{
    public required int PriceTableId { get; set; }
    public required int ProductId { get; set; }
    public decimal? OverrideSalePrice { get; set; }
}
