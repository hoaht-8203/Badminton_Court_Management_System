using ApiApplication.Dtos.InventoryCheck;

namespace ApiApplication.Services;

public interface IInventoryCheckService
{
    Task<List<ListInventoryCheckResponse>> ListAsync(ListInventoryCheckRequest request);
    Task<DetailInventoryCheckResponse> DetailAsync(int id);
    Task<int> CreateAsync(CreateInventoryCheckRequest request);
    Task UpdateAsync(int id, CreateInventoryCheckRequest request);
    Task CancelAsync(int id);
    Task<List<int>> BulkCancelAsync(List<int> ids);
    Task CompleteAsync(int id);
    Task<int> MergeAsync(List<int> ids);
}
