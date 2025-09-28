using ApiApplication.Dtos;
using ApiApplication.Dtos.Customer;

namespace ApiApplication.Services;

public interface ICustomerService
{
    Task<List<ListCustomerResponse>> ListCustomersAsync(ListCustomerRequest request);
    Task<PagedResponse<ListCustomerResponse>> ListCustomersPagedAsync(
        ListCustomerPagedRequest request,
        CancellationToken cancellationToken = default
    );
    Task<DetailCustomerResponse> GetCustomerByIdAsync(DetailCustomerRequest request);
    Task<DetailCustomerResponse> CreateCustomerAsync(CreateCustomerRequest request);
    Task<DetailCustomerResponse> UpdateCustomerAsync(UpdateCustomerRequest request);
    Task<bool> DeleteCustomerAsync(DeleteCustomerRequest request);
    Task<DetailCustomerResponse> ChangeCustomerStatusAsync(ChangeCustomerStatusRequest request);
}
