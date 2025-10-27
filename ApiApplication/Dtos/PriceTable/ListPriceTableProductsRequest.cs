using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceTable;

public class ListPriceTableProductsRequest
{
    [Required]
    public int PriceTableId { get; set; }
}
