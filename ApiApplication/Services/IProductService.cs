using ApiApplication.Dtos;

namespace ApiApplication.Services;

public interface IProductService
{
    Task<List<ListProductResponse>> ListAsync(ListProductRequest request);
    Task<DetailProductResponse> DetailAsync(int id);
    Task CreateAsync(CreateProductRequest request);
    Task UpdateAsync(UpdateProductRequest request);
    Task DeleteAsync(DeleteProductRequest request);
    Task UpdateImagesAsync(UpdateProductImagesRequest request);
    Task UpdateStatusAsync(int id, bool isActive);
} 