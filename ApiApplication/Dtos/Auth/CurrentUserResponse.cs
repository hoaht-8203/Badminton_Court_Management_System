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
    public string? PhoneNumber { get; set; }
    public List<string> Roles { get; set; } = [];
    public UserMembershipInfo? Membership { get; set; }
}

public class UserMembershipInfo
{
    public int Id { get; set; }
    public int MembershipId { get; set; }
    public string? MembershipName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public string Status { get; set; } = string.Empty;
}
