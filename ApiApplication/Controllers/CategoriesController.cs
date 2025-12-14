using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Category;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyConstants.WarehouseAccess)]
public class CategoriesController(ICategoryService categoryService) : ControllerBase
{
    private readonly ICategoryService _categoryService = categoryService;

    [HttpGet("list")]
    public async Task<ApiResponse<ListCategoryResponse[]>> List(
        [FromQuery] ListCategoryRequest request
    )
    {
        var data = await _categoryService.ListAsync(request);
        return ApiResponse<ListCategoryResponse[]>.SuccessResponse(data.ToArray());
    }

    [HttpGet("detail")]
    public async Task<ApiResponse<DetailCategoryResponse>> Detail(
        [FromQuery] DetailCategoryRequest request
    )
    {
        var data = await _categoryService.DetailAsync(request.Id);
        return ApiResponse<DetailCategoryResponse>.SuccessResponse(data);
    }

    [HttpPost("create")]
    public async Task<ApiResponse<object?>> Create([FromBody] CreateCategoryRequest request)
    {
        await _categoryService.CreateAsync(request);
        return ApiResponse<object?>.SuccessResponse(null, "Tạo nhóm hàng thành công");
    }

    [HttpPut("update")]
    public async Task<ApiResponse<object?>> Update([FromBody] UpdateCategoryRequest request)
    {
        await _categoryService.UpdateAsync(request);
        return ApiResponse<object?>.SuccessResponse(null, "Cập nhật nhóm hàng thành công");
    }

    [HttpDelete("delete")]
    public async Task<ApiResponse<object?>> Delete([FromQuery] DeleteCategoryRequest request)
    {
        await _categoryService.DeleteAsync(request);
        return ApiResponse<object?>.SuccessResponse(null, "Xóa nhóm hàng thành công");
    }
}
