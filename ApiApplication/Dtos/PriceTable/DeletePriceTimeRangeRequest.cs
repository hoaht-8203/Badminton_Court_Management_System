using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.PriceTable;

public class DeletePriceTimeRangeRequest
{
    [Required]
    public int Id { get; set; }
}
