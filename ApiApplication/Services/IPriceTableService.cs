using ApiApplication.Dtos;

namespace ApiApplication.Services;

public interface IPriceTableService
{
    Task<List<ListPriceTableResponse>> ListAsync(ListPriceTableRequest request);
    Task<DetailPriceTableResponse> DetailAsync(int id);
    Task CreateAsync(CreatePriceTableRequest request);
    Task UpdateAsync(UpdatePriceTableRequest request);
    Task DeleteAsync(DeletePriceTableRequest request);
    Task SetProductsAsync(SetPriceTableProductsRequest request);
    Task<ListPriceTableProductsResponse> GetProductsAsync(int priceTableId);
    Task UpdateStatusAsync(int id, bool isActive);
} 