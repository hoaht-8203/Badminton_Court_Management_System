using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos;

public class CreateProductRequest
{
    [MaxLength(50)]
    public string? Code { get; set; }

    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    public string? MenuType { get; set; }
    public string? Category { get; set; }
    public string? Position { get; set; }

    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }

    public bool IsDirectSale { get; set; } = true;
    public bool IsActive { get; set; } = true;

    public bool ManageInventory { get; set; } = false;
    public int Stock { get; set; } = 0;
    public int MinStock { get; set; } = 0;
    public int MaxStock { get; set; } = 0;

    public string? Description { get; set; }
    public string? NoteTemplate { get; set; }

    public List<string> Images { get; set; } = new();

    public string? Unit { get; set; }
}
