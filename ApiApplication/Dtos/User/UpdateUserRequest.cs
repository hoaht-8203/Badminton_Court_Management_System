using System;

namespace ApiApplication.Dtos.User;

public class UpdateUserRequest
{
    public required Guid UserId { get; set; }
    public required string FullName { get; set; }

    public required string UserName { get; set; }
    public required string Email { get; set; }
    public string? Password { get; set; }
    public required string PhoneNumber { get; set; }
    public string? Role { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Ward { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Note { get; set; }
}
