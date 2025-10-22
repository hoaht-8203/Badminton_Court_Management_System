using ApiApplication.Dtos.Cashflow;

namespace ApiApplication.Services;

public interface ICashflowService
{
    Task<CashflowResponse[]> ListAsync(ListCashflowRequest request);
    Task<CashflowResponse?> DetailAsync(int id);
    Task<int> CreateCashflowAsync(CreateCashflowRequest request);
    Task UpdateAsync(int id, UpdateCashflowRequest request);
    Task DeleteAsync(int id);
    Task<List<string>> GetRelatedPersonsAsync(string personType);
}
