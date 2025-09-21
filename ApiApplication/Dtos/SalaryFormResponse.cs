namespace ApiApplication.Dtos;

public class SalaryFormResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SalarySettings { get; set; } = "{}";
    public string? Note { get; set; }
    public bool IsActive { get; set; }
}
