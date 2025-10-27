using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceTable;

public class DetailPriceTableRequest
{
    [Required]
    public int Id { get; set; }
}
