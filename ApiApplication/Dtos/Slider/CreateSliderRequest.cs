using System;

namespace ApiApplication.Dtos.Slider;

public class CreateSliderRequest
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public required string ImageUrl { get; set; }
    public string? BackLink { get; set; }
}
