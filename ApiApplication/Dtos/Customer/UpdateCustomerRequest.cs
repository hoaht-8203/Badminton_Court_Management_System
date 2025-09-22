using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Customer;

public class UpdateCustomerRequest
{
    [Required(ErrorMessage = "ID khách hàng là bắt buộc")]
    public required int Id { get; set; }

    [MaxLength(100, ErrorMessage = "Họ và tên không được vượt quá 100 ký tự")]
    public string? FullName { get; set; }

    [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
    [MaxLength(20, ErrorMessage = "Số điện thoại không được vượt quá 20 ký tự")]
    public string? PhoneNumber { get; set; }

    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    [MaxLength(100, ErrorMessage = "Email không được vượt quá 100 ký tự")]
    public string? Email { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public string? Gender { get; set; }

    public string? Address { get; set; }

    public string? City { get; set; }

    public string? District { get; set; }

    public string? Ward { get; set; }

    public string? IDCard { get; set; }

    public string? Note { get; set; }

    public string? AvatarUrl { get; set; }
}
