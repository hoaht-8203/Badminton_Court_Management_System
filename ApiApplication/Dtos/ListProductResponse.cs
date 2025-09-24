using System;

namespace ApiApplication.Dtos;

public class ListProductResponse
{
    public required int Id { get; set; }
    public string? Code { get; set; }
    public required string Name { get; set; }
    public string? Category { get; set; }
    public string? MenuType { get; set; }
    public decimal SalePrice { get; set; }
    public bool IsDirectSale { get; set; }
} 