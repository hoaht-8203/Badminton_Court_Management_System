using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Branch : BaseEntity
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Address { get; set; }
    public required string PhoneNumber { get; set; }
    public string? Note { get; set; }
    public required bool IsMainBranch { get; set; } = false;
    public required bool IsActive { get; set; } = true;
}
