using System;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Entities;

public class ApplicationUserToken
{
    [Key]
    public int Id { get; set; }
    public required string Token { get; set; }
    public required string TokenType { get; set; }
    public required DateTime ExpiresAtUtc { get; set; }
    public required Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
}
