using System;

namespace ApiApplication.Dtos.Payroll;

public class ListPayrollRequest
{
    public string? Keyword { get; set; }
    public string? Status { get; set; }
    public string? StartDateOperator { get; set; } // ">", "=", "<"
    public DateTime? StartDate { get; set; }
    public string? EndDateOperator { get; set; } // ">", "=", "<"
    public DateTime? EndDate { get; set; }
}

