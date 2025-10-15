using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Payroll;

public class PayrollDetailResponse
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Status { get; set; } = PayrollStatus.Pending;
    public string? Note { get; set; }
    public decimal TotalNetSalary { get; set; }
    public decimal TotalPaidAmount { get; set; }
    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? CreatedBy { get; set; }

    public string? UpdatedBy { get; set; }

    public ICollection<PayrollItemResponse> PayrollItems { get; set; } =
        new List<PayrollItemResponse>();
}
