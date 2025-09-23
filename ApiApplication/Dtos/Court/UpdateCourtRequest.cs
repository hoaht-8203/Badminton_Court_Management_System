namespace ApiApplication.Dtos.Court;

public class UpdateCourtRequest
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public string? ImageUrl { get; set; }
    public required decimal Price { get; set; }
    public required int PriceUnitId { get; set; }
    public required int CourtAreaId { get; set; }
    public string? Note { get; set; }
}
