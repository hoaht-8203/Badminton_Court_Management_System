using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos;

public class DeletePriceTableRequest
{
    [Required]
    public int Id { get; set; }
}
