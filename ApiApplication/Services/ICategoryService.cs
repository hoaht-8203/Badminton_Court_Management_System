using ApiApplication.Dtos.Category;

namespace ApiApplication.Services;

public interface ICategoryService
{
    Task<List<ListCategoryResponse>> ListAsync(ListCategoryRequest request);
    Task<DetailCategoryResponse> DetailAsync(int id);
    Task CreateAsync(CreateCategoryRequest request);
    Task UpdateAsync(UpdateCategoryRequest request);
    Task DeleteAsync(DeleteCategoryRequest request);
}
