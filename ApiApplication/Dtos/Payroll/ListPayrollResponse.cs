using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Payroll;

public class ListPayrollResponse
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Status { get; set; } = PayrollStatus.Pending;
    public string? Note { get; set; }
    public decimal TotalNetSalary { get; set; }
    public decimal TotalPaidAmount { get; set; }
}
