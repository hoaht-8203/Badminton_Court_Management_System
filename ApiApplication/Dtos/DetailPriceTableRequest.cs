using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos;

public class DetailPriceTableRequest
{
    [Required]
    public int Id { get; set; }
}
