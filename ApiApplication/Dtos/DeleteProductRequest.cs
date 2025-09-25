using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos;

public class DeleteProductRequest
{
    [Required]
    public int Id { get; set; }
} 