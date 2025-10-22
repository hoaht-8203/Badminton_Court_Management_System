using System;

namespace ApiApplication.Dtos.RelationPerson;

public class RelatedPersonResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Company { get; set; }
    public string? Note { get; set; }
    public bool IsActive { get; set; }
}
