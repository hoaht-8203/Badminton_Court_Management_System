using System;

namespace ApiApplication.Dtos.Auth;

public class UpdateMyProfileRequest
{
    public required string FullName { get; set; }
    public required string PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Ward { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
}
