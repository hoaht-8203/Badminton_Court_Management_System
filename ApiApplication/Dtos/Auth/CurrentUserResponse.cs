using System;

namespace ApiApplication.Dtos.Auth;

public class CurrentUserResponse
{
    public Guid UserId { get; set; }
    public required string UserName { get; set; }
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public bool EmailConfirmed { get; set; }
    public string? AvatarUrl { get; set; }
    public List<string> Roles { get; set; } = [];
}
