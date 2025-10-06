using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Category;

public class DeleteCategoryRequest
{
    [Required]
    public int Id { get; set; }
}
