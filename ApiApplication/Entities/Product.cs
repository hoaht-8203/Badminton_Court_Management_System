using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Product : BaseEntity
{
    [Key]
    public int Id { get; set; }


    [MaxLength(50)]
    public string? Code { get; set; } 

    [Required]
    [MaxLength(255)]
    public required string Name { get; set; } 

    [MaxLength(100)]
    public string? MenuType { get; set; } 


    public int? CategoryId { get; set; } 
    public virtual Category? Category { get; set; } 

    [MaxLength(150)]
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

    public string[] Images { get; set; } = Array.Empty<string>(); 

    [MaxLength(50)]
    public string? Unit { get; set; } 

    public virtual List<InventoryCard> InventoryCards { get; set; } = new();
}
