using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Slider;

public class UpdateSliderRequest : BaseEntity
{
    public required int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public required string ImageUrl { get; set; }
    public string? BackLink { get; set; }
}
