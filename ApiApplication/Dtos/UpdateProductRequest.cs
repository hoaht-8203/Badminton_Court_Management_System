using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos;

public class UpdateProductRequest
{
    [Required]
    public int Id { get; set; }

    [MaxLength(50)]
    public string? Code { get; set; }

    [MaxLength(255)]
    public string? Name { get; set; }

    public string? MenuType { get; set; }
    public int? CategoryId { get; set; }
    public string? Position { get; set; }

    public decimal? CostPrice { get; set; }
    public decimal? SalePrice { get; set; }

    public bool? IsDirectSale { get; set; }
    public bool? IsActive { get; set; }

    public bool? ManageInventory { get; set; }
    public int? Stock { get; set; }
    public int? MinStock { get; set; }
    public int? MaxStock { get; set; }

    public string? Description { get; set; }
    public string? NoteTemplate { get; set; }

    public List<string>? Images { get; set; }

    public string? Unit { get; set; }
}
