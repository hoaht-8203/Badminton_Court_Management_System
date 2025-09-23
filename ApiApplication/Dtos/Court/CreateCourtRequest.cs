using System;

namespace ApiApplication.Dtos.Court;

public class CreateCourtRequest
{
    public required string Name { get; set; }
    public string? ImageUrl { get; set; }
    public required decimal Price { get; set; }
    public required int PriceUnitId { get; set; }
    public required int CourtAreaId { get; set; }
    public string? Note { get; set; }
}
