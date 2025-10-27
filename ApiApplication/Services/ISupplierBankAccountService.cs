using ApiApplication.Dtos.SupplierBankAccount;
using ApiApplication.Entities;

namespace ApiApplication.Services;

public interface ISupplierBankAccountService
{
    Task<List<SupplierBankAccount>> ListAsync(int supplierId);
    Task<int> CreateAsync(UpsertBankAccountRequest req);
    Task UpdateAsync(int id, UpsertBankAccountRequest req);
    Task DeleteAsync(int id);
}
