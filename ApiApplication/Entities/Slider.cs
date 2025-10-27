using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Slider : BaseEntity
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public required string ImageUrl { get; set; }
    public string? BackLink { get; set; }

    public required string Status { get; set; } = SliderStatus.Active;
}
