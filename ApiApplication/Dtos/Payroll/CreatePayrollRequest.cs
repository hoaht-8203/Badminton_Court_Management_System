using System;

namespace ApiApplication.Dtos.Payroll;

public class CreatePayrollRequest
{
    public required string Name { get; set; } 
    public required DateOnly StartDate { get; set; }
    public required DateOnly EndDate { get; set; }
    public string? Note { get; set; }
}
