using ApiApplication.Dtos.Receipt;

namespace ApiApplication.Services;

public interface IReceiptService
{
    Task<List<ListReceiptResponse>> ListAsync(DateTime? from, DateTime? to, int? status);
    Task<int> CreateAsync(CreateReceiptRequest req);
    Task<DetailReceiptResponse> DetailAsync(int id);
    Task UpdateAsync(int id, CreateReceiptRequest req);
    Task CompleteAsync(int id);
    Task CancelAsync(int id);
}


