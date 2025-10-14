using ApiApplication.Dtos.StockOut;

namespace ApiApplication.Services
{
    public interface IStockOutService
    {
        Task<List<ListStockOutResponse>> ListAsync(DateTime? from, DateTime? to, int? status);
        Task<DetailStockOutResponse> DetailAsync(int id);
        Task<int> CreateAsync(CreateStockOutRequest request);
        Task UpdateAsync(int id, CreateStockOutRequest request);
        Task CompleteAsync(int id);
        Task CancelAsync(int id);
    }
}
