using System;

namespace ApiApplication.Entities;

public class PayrollItem
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public int StaffId { get; set; }
    public Staff? Staff { get; set; }
    public int PayrollId { get; set; }
    public Payroll? Payroll { get; set; }
    public decimal NetSalary { get; set; } = 0;
    public decimal PaidAmount { get; set; } = 0;
    public string? Note { get; set; }
    public string Status { get; set; } = ""; // Pending, Approved, Rejected
}
