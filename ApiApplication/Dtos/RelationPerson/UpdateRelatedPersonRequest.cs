using System;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.RelationPerson;

public class UpdateRelatedPersonRequest
{
    [Required]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = null!;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? Company { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public bool IsActive { get; set; } = true;
}
