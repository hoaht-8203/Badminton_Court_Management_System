using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Customer : BaseEntity, IAuditableEntity
{
    [Key]
    public int Id { get; set; }
    public required string FullName { get; set; }
    public required string PhoneNumber { get; set; }
    public required string Email { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Ward { get; set; }
    public string? IDCard { get; set; } // căn cước công dân
    public string? Note { get; set; }
    public required string Status { get; set; } = CustomerStatus.Active;
}
