using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos;

public class UpdatePriceTableRequest : CreatePriceTableRequest
{
    [Required]
    public int Id { get; set; }
}
