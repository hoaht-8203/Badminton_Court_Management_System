using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceTable;

public class DeletePriceTableRequest
{
    [Required]
    public int Id { get; set; }
}
