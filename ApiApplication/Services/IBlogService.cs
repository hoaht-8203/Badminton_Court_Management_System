using ApiApplication.Dtos.Blog;

namespace ApiApplication.Services;

public interface IBlogService
{
    Task<List<ListBlogResponse>> GetBlogsAsync(ListBlogRequest request);
    Task<DetailBlogResponse?> GetBlogByIdAsync(DetailBlogRequest request);
    Task<DetailBlogResponse> CreateBlogAsync(CreateBlogRequest request);
    Task<DetailBlogResponse> UpdateBlogAsync(UpdateBlogRequest request);
    Task<bool> DeleteBlogAsync(DeleteBlogRequest request);
}
