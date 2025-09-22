using System;

namespace ApiApplication.Dtos;

public class DetailSupplierResponse
{
    public required int Id { get; set; }
    public required string Name { get; set; }
    public required string Phone { get; set; }
    public required string Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Ward { get; set; }
    public string? Notes { get; set; }
    public required string Status { get; set; }
}
