using ApiApplication.Dtos;
using ApiApplication.Dtos.Product;
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

        /// <summary>
        /// Lấy danh sách sản phẩm theo bảng giá
        /// </summary>
        /// <param name="request">Tham số yêu cầu (CheckTime là optional)</param>
        /// <returns>Danh sách sản phẩm theo bảng giá</returns>
        [HttpGet("list-by-price-table")]
        public async Task<
            ActionResult<ApiResponse<List<ListProductsByPriceTableResponse>>>
        > ListByPriceTable([FromQuery] ListProductsByPriceTableRequest request)
        {
            var result = await _productService.ListByPriceTableAsync(request);
            return Ok(
                ApiResponse<List<ListProductsByPriceTableResponse>>.SuccessResponse(
                    result,
                    "Lấy danh sách sản phẩm theo bảng giá thành công"
                )
            );
        }
    }
}
