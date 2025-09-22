using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Department : BaseEntity
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required bool IsActive { get; set; } = true;
}