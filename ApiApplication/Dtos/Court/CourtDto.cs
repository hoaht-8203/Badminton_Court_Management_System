using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Court;

public class CourtDto : BaseEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int CourtAreaId { get; set; }
    public string CourtAreaName { get; set; } = string.Empty;
    public string? Note { get; set; }
}
