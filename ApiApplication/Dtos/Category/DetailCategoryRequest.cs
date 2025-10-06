using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Category;

public class DetailCategoryRequest
{
    [Required]
    public int Id { get; set; }
}
