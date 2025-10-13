using System;

namespace ApiApplication.Dtos.Payroll;

public class PayrollItemResponse
{
    public int Id { get; set; }
    public string StaffName { get; set; }
    public decimal NetSalary { get; set; } = 0;
    public decimal PaidAmount { get; set; } = 0;
    public string? Note { get; set; }
    public string Status { get; set; }
}
