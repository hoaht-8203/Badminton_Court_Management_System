using System;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos;

public class CreateSupplierRequest
{
    [Required(ErrorMessage = "Họ và tên là bắt buộc")]
    [MaxLength(100, ErrorMessage = "Họ và tên không được vượt quá 100 ký tự")]
    public required string Name { get; set; }

    [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
    [MaxLength(20, ErrorMessage = "Số điện thoại không được vượt quá 20 ký tự")]
    public required string Phone { get; set; }

    [Required(ErrorMessage = "Email là bắt buộc")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    [MaxLength(100, ErrorMessage = "Email không được vượt quá 100 ký tự")]
    public required string Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Ward { get; set; }
    public string? Notes { get; set; }
}
