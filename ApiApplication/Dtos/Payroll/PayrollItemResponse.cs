using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Payroll;

public class PayrollItemResponse
{
    public int Id { get; set; }
    public int StaffId { get; set; }
    public StaffResponse? Staff { get; set; }
    public decimal NetSalary { get; set; } = 0;
    public decimal PaidAmount { get; set; } = 0;
    public string? Note { get; set; }
    public string Status { get; set; } = PayrollStatus.Pending;
    // Payroll related info
    public int PayrollId { get; set; }
    public string? PayrollName { get; set; }
    public DateOnly PayrollStartDate { get; set; }
    public DateOnly PayrollEndDate { get; set; }
    public DateTime PayrollCreatedAt { get; set; }
}
