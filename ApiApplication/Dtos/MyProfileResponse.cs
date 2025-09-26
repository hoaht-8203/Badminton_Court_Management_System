using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos;

public class MyProfileResponse : BaseEntity
{
    public required string FullName { get; set; }
    public required string UserName { get; set; }
    public required string Email { get; set; }
    public required string PhoneNumber { get; set; }
    public required string[] Roles { get; set; }
    public required string Status { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Ward { get; set; }
    public string? AvatarUrl { get; set; }
    public DateOnly? DateOfBirth { get; set; }
}
