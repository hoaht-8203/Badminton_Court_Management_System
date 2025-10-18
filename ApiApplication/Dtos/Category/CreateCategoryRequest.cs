using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Category;

public class CreateCategoryRequest
{
    [Required]
    [MaxLength(100)]
    public string? Name { get; set; }
}
