using System;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.User;

public class CreateAdministratorRequest
{
    public required string UserName { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    
    [RegularExpression(@"^0[0-9]{9,10}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và có 10-11 số")]
    public required string PhoneNumber { get; set; }
    public required string Role { get; set; }
    public required string FullName { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Ward { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Note { get; set; }
    public int? StaffId { get; set; }
}
