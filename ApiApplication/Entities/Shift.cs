using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Shift : BaseEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = "Ca mới";
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool IsActive { get; set; } = true;
}