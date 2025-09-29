using System;

namespace ApiApplication.Dtos.Supplier;

public class ListSupplierRequest
{
    public int? Id { get; set; }
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Status { get; set; }
}
