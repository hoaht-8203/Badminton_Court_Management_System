using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceTable;

public class UpdatePriceTableRequest : CreatePriceTableRequest
{
    [Required]
    public int Id { get; set; }
}
