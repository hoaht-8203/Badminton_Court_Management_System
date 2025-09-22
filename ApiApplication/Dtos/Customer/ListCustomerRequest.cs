namespace ApiApplication.Dtos.Customer;

public class ListCustomerRequest
{
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Ward { get; set; }
    public string? Status { get; set; }
}
