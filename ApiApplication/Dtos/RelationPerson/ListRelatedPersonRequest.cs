using System;

namespace ApiApplication.Dtos.RelationPerson;

public class ListRelatedPersonRequest 
{
    public string? Keyword { get; set; }
    public bool? IsActive { get; set; }
}
