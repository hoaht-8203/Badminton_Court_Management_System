using ApiApplication.Dtos;
using ApiApplication.Dtos.Customer;

namespace ApiApplication.Services;

public interface ICustomerService
{
    Task<List<ListCustomerResponse>> ListCustomersAsync(ListCustomerRequest request);
    Task<DetailCustomerResponse> GetCustomerByIdAsync(int id);
    Task<DetailCustomerResponse> CreateCustomerAsync(CreateCustomerRequest request);
    Task<DetailCustomerResponse> UpdateCustomerAsync(UpdateCustomerRequest request);
    Task<bool> DeleteCustomerAsync(DeleteCustomerRequest request);
    Task<DetailCustomerResponse> ChangeCustomerStatusAsync(ChangeCustomerStatusRequest request);
}
