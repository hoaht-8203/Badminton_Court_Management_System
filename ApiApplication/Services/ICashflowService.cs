using ApiApplication.Dtos.Cashflow;

namespace ApiApplication.Services;

public interface ICashflowService
{
    Task<CashflowResponse[]> ListAsync(ListCashflowRequest request);
    Task<CashflowResponse?> DetailAsync(DetailCashflowRequest request);
    Task<int> CreateCashflowAsync(CreateCashflowRequest request);
    Task UpdateAsync(UpdateCashflowRequest request);
    Task DeleteAsync(int id);
}
