using System;

namespace ApiApplication.Dtos;

public class ListProductRequest
{
    public int? Id { get; set; }
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? MenuType { get; set; }
    public string? Category { get; set; }
    public bool? IsDirectSale { get; set; }
} 