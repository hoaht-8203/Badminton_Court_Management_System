using System;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Payroll;

public class CreatePayrollRequest
{
    [Required(ErrorMessage = "Tên bảng lương là bắt buộc")]
    [MaxLength(255, ErrorMessage = "Tên bảng lương không được vượt quá 255 ký tự")]
    public required string Name { get; set; }

    [Required(ErrorMessage = "Ngày bắt đầu là bắt buộc")]
    public required DateOnly StartDate { get; set; }

    [Required(ErrorMessage = "Ngày kết thúc là bắt buộc")]
    public required DateOnly EndDate { get; set; }

    [MaxLength(1000, ErrorMessage = "Ghi chú không được vượt quá 1000 ký tự")]
    public string? Note { get; set; }
}
