namespace ApiApplication.Dtos.Court;

public class ListCourtResponse
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? ImageUrl { get; set; }
    public decimal Price { get; set; }
    public int PriceUnitId { get; set; }
    public string? PriceUnitName { get; set; }
    public int CourtAreaId { get; set; }
    public string? CourtAreaName { get; set; }
    public string? Note { get; set; }
    public string? Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
