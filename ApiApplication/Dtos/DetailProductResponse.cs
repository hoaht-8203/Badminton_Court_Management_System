using System.Collections.Generic;

namespace ApiApplication.Dtos;

public class DetailProductResponse
{
    public required int Id { get; set; }
    public string? Code { get; set; }
    public required string Name { get; set; }
    public string? MenuType { get; set; }
    public string? Category { get; set; }
    public string? Position { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    public bool IsDirectSale { get; set; }
    public bool IsExtraTopping { get; set; }
    public bool IsActive { get; set; }
    public bool ManageInventory { get; set; }
    public int Stock { get; set; }
    public int MinStock { get; set; }
    public int MaxStock { get; set; }
    public string? Description { get; set; }
    public string? NoteTemplate { get; set; }
    public List<string> Images { get; set; } = new();
    public string? Unit { get; set; }
} 