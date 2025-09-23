namespace ApiApplication.Dtos.Court;

public class ListCourtRequest
{
    public string? Name { get; set; }
    public int? CourtAreaId { get; set; }
    public string? Status { get; set; }
}
