namespace ApiApplication.Dtos.Customer;

public class ListCustomerPagedRequest : ListCustomerRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 2;
}
