using ApiApplication.Dtos;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
public class ProductsController(IProductService productService) : ControllerBase
{
    private readonly IProductService _productService = productService;

        [HttpGet("list")]
        public async Task<ActionResult<ApiResponse<List<ListProductResponse>>>> List(
            [FromQuery] ListProductRequest request
        )
        {
            var result = await _productService.ListAsync(request);
            return Ok(
                ApiResponse<List<ListProductResponse>>.SuccessResponse(
                    result,
                    "Lấy danh sách sản phẩm thành công"
                )
            );
        }

        [HttpGet("detail")]
        public async Task<ActionResult<ApiResponse<DetailProductResponse>>> Detail(
            [FromQuery] DetailProductRequest request
        )
        {
            var result = await _productService.DetailAsync(request.Id);
            return Ok(
                ApiResponse<DetailProductResponse>.SuccessResponse(
                    result,
                    "Lấy chi tiết sản phẩm thành công"
                )
            );
        }

        [HttpPost("create")]
        public async Task<ActionResult<ApiResponse<object?>>> Create(
            [FromBody] CreateProductRequest request
        )
        {
            await _productService.CreateAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Tạo sản phẩm thành công"));
        }

        [HttpPut("update")]
        public async Task<ActionResult<ApiResponse<object?>>> Update(
            [FromBody] UpdateProductRequest request
        )
        {
            await _productService.UpdateAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Cập nhật sản phẩm thành công"));
        }

        [HttpPut("update-status")]
        public async Task<ActionResult<ApiResponse<object?>>> UpdateStatus(
            [FromQuery] int id,
            [FromQuery] bool isActive
        )
        {
            await _productService.UpdateStatusAsync(id, isActive);
            return Ok(
                ApiResponse<object?>.SuccessResponse(
                    null,
                    "Cập nhật trạng thái sản phẩm thành công"
                )
            );
        }

        [HttpDelete("delete")]
        public async Task<ActionResult<ApiResponse<object?>>> Delete(
            [FromQuery] DeleteProductRequest request
        )
        {
            await _productService.DeleteAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Xóa sản phẩm thành công"));
        }

        [HttpPost("update-images")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ApiResponse<object?>>> UpdateImages(
            [FromForm] UpdateProductImagesRequest request
        )
        {
            await _productService.UpdateImagesAsync(request);
            return Ok(
                ApiResponse<object?>.SuccessResponse(null, "Cập nhật hình ảnh sản phẩm thành công")
            );
        }
        
        [HttpPost("check-low-stock")]
        public async Task<ActionResult<ApiResponse<object>>> CheckLowStock(
            [FromQuery] string? branch = null
        )
        {
            var count = await _productService.CheckLowStockAndCreateInventoryChecksAsync(branch);
            if (count > 0)
            {
            }
            return Ok(
                ApiResponse<object>.SuccessResponse(
                    new { count },
                    count > 0
                        ? $"Đã tạo {count} phiếu kiểm kho cho sản phẩm có tồn kho thấp"
                        : "Không có sản phẩm nào cần tạo phiếu kiểm kho"
                )
            );
        }
    }
}
