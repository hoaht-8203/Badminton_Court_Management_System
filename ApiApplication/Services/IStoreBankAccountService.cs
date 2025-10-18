using ApiApplication.Dtos.StoreBankAccount;

namespace ApiApplication.Services
{
    public interface IStoreBankAccountService
    {
        Task<List<StoreBankAccountResponse>> ListAsync();
        Task<StoreBankAccountResponse> CreateAsync(CreateStoreBankAccountRequest request);
        Task<string> UpdateAsync(int id, CreateStoreBankAccountRequest request);
        Task<string> DeleteAsync(int id);
    }
}
