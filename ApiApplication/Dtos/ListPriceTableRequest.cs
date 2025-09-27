namespace ApiApplication.Dtos;

public class ListPriceTableRequest
{
    public int? Id { get; set; }
    public string? Name { get; set; }
    public bool? IsActive { get; set; }
}
