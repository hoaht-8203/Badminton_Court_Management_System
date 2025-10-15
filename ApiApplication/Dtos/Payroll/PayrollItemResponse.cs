using System;

namespace ApiApplication.Dtos.Payroll;

public class PayrollItemResponse
{
    public int Id { get; set; }
    public int StaffId { get; set; }
    public StaffResponse? Staff { get; set; }
    public decimal NetSalary { get; set; } = 0;
    public decimal PaidAmount { get; set; } = 0;
    public string? Note { get; set; }
    public string Status { get; set; }
}
