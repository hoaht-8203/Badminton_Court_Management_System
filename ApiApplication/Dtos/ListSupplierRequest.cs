using System;

namespace ApiApplication.Dtos;

public class ListSupplierRequest
{
    public int? Id { get; set; }
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Status { get; set; }
}
