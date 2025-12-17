using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Blog;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyConstants.ManagementOnly)]
public class BlogsController(IBlogService blogService) : ControllerBase
{
    private readonly IBlogService _blogService = blogService;

    [AllowAnonymous]
    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListBlogResponse>>>> GetBlogs(
        [FromQuery] ListBlogRequest request
    )
    {
        var responses = await _blogService.GetBlogsAsync(request);
        return Ok(
            ApiResponse<List<ListBlogResponse>>.SuccessResponse(
                responses,
                "Lấy danh sách blog thành công"
            )
        );
    }

    [AllowAnonymous]
    [HttpGet("detail")]
    public async Task<ActionResult<ApiResponse<DetailBlogResponse?>>> GetBlogById(
        [FromQuery] DetailBlogRequest request
    )
    {
        var response = await _blogService.GetBlogByIdAsync(request);
        return Ok(
            ApiResponse<DetailBlogResponse?>.SuccessResponse(
                response,
                "Lấy chi tiết blog thành công"
            )
        );
    }

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<DetailBlogResponse>>> CreateBlog(
        [FromBody] CreateBlogRequest request
    )
    {
        var response = await _blogService.CreateBlogAsync(request);
        return Ok(ApiResponse<DetailBlogResponse>.SuccessResponse(response, "Tạo blog thành công"));
    }

    [HttpPut("update")]
    public async Task<ActionResult<ApiResponse<DetailBlogResponse>>> UpdateBlog(
        [FromBody] UpdateBlogRequest request
    )
    {
        var response = await _blogService.UpdateBlogAsync(request);
        return Ok(
            ApiResponse<DetailBlogResponse>.SuccessResponse(response, "Cập nhật blog thành công")
        );
    }

    [HttpDelete("delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteBlog(DeleteBlogRequest request)
    {
        var response = await _blogService.DeleteBlogAsync(request);
        return Ok(ApiResponse<bool>.SuccessResponse(response, "Xóạb blog thành c00?k"));
    }
}
