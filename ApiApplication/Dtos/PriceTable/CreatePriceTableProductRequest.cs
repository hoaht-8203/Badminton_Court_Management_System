using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceTable;

public class CreatePriceTableProductRequest
{
    [Required]
    public int PriceTableId { get; set; }

    [Required]
    public int ProductId { get; set; }

    public decimal? OverrideSalePrice { get; set; }
}
