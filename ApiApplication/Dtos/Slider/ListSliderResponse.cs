using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Slider;

public class ListSliderResponse : BaseEntity
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string ImageUrl { get; set; }
    public string? BackLink { get; set; }
    public required string Status { get; set; }
}
