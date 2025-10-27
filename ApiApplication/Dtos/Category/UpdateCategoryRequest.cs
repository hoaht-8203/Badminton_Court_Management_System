using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Category;

public class UpdateCategoryRequest
{
    [Required]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string? Name { get; set; }
}
