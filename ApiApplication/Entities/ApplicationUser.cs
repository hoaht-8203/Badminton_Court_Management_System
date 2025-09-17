using System;
using ApiApplication.Entities.Shared;
using Microsoft.AspNetCore.Identity;

namespace ApiApplication.Entities;

public class ApplicationUser : IdentityUser<Guid>, IAuditableEntity
{
    public required string FullName { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Ward { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Note { get; set; }
    public required string Status { get; set; } = ApplicationUserStatus.Active;
    public required ICollection<ApplicationUserToken> UserTokens { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
