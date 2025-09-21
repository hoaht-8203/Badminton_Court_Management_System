using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class SystemConfig : BaseEntity
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Group { get; set; }
    public string? Description { get; set; }
}