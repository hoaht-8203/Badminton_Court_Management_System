using System;

namespace ApiApplication.Entities;

public class SalaryForm
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string SalarySettings { get; set; } = "{}";
    public string? Note { get; set; }
    public required bool IsActive { get; set; } = true;
}