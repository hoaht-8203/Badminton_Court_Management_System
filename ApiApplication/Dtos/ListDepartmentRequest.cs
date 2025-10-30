namespace ApiApplication.Dtos;

public class ListDepartmentRequest
{
    // Filter by active/inactive. Null = all
    public bool? IsActive { get; set; }
    public string? Keyword { get; set; }
}
