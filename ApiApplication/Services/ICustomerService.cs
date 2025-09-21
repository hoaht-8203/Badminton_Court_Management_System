using ApiApplication.Dtos;
using ApiApplication.Dtos.Customer;

namespace ApiApplication.Services;

public interface ICustomerService
{
    Task<List<ListCustomerResponse>> ListCustomersAsync(ListCustomerRequest request);
    Task<CustomerDetailResponse> GetCustomerByIdAsync(int id);
    Task<CustomerDetailResponse> CreateCustomerAsync(CreateCustomerRequest request);
    Task<CustomerDetailResponse> UpdateCustomerAsync(UpdateCustomerRequest request);
    Task<bool> DeleteCustomerAsync(DeleteCustomerRequest request);
    Task<CustomerDetailResponse> ChangeCustomerStatusAsync(ChangeCustomerStatusRequest request);
}
