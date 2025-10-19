using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceTable;

public class DeletePriceTableProductRequest
{
    [Required]
    public int PriceTableId { get; set; }

    [Required]
    public int ProductId { get; set; }
}
