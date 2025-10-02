using ApiApplication.Dtos.Pagination;

namespace ApiApplication.Dtos.Customer;

public class ListCustomerPagedRequest : PaginationRequest
{
    public string? Keyword { get; set; }
}
