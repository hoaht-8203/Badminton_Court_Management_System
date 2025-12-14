using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Dtos.PriceTable;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = PolicyConstants.ManagementOnly)]
public class PricesController(IPriceTableService service) : ControllerBase
{
    private readonly IPriceTableService _service = service;

    /// <summary>
    /// List price tables - Accessible by customers to view pricing
    /// </summary>
    [AllowAnonymous]
    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListPriceTableResponse>>>> List(
        [FromQuery] ListPriceTableRequest request
    )
    {
        var result = await _service.ListAsync(request);
        return Ok(
            ApiResponse<List<ListPriceTableResponse>>.SuccessResponse(
                result,
                "Lấy danh sách bảng giá thành công"
            )
        );
    }

    /// <summary>
    /// Get price table details - Accessible by customers to view pricing details
    /// </summary>
    [AllowAnonymous]
    [HttpGet("detail")]
    public async Task<ActionResult<ApiResponse<DetailPriceTableResponse>>> Detail(
        [FromQuery] DetailPriceTableRequest request
    )
    {
        var result = await _service.DetailAsync(request.Id);
        return Ok(
            ApiResponse<DetailPriceTableResponse>.SuccessResponse(
                result,
                "Lấy chi tiết bảng giá thành công"
            )
        );
    }

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<object?>>> Create(
        [FromBody] CreatePriceTableRequest request
    )
    {
        await _service.CreateAsync(request);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "Tạo bảng giá thành công"));
    }

    [HttpPut("update")]
    public async Task<ActionResult<ApiResponse<object?>>> Update(
        [FromBody] UpdatePriceTableRequest request
    )
    {
        await _service.UpdateAsync(request);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "Cập nhật bảng giá thành công"));
    }

    [HttpPut("update-status")]
    public async Task<ActionResult<ApiResponse<object?>>> UpdateStatus(
        [FromQuery] int id,
        [FromQuery] bool isActive
    )
    {
        await _service.UpdateStatusAsync(id, isActive);
        return Ok(
            ApiResponse<object?>.SuccessResponse(null, "Cập nhật trạng thái bảng giá thành công")
        );
    }

    [HttpDelete("delete")]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(
        [FromQuery] DeletePriceTableRequest request
    )
    {
        await _service.DeleteAsync(request);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "Xóa bảng giá thành công"));
    }

    [HttpPost("set-products")]
    public async Task<ActionResult<ApiResponse<object?>>> SetProducts(
        [FromBody] SetPriceTableProductsRequest request
    )
    {
        await _service.SetProductsAsync(request);
        return Ok(
            ApiResponse<object?>.SuccessResponse(null, "Cập nhật sản phẩm cho bảng giá thành công")
        );
    }

    /// <summary>
    /// Get products in price table - Accessible by customers to view product pricing
    /// </summary>
    [AllowAnonymous]
    [HttpGet("get-products")]
    public async Task<ActionResult<ApiResponse<ListPriceTableProductsResponse>>> GetProducts(
        [FromQuery] int priceTableId
    )
    {
        var res = await _service.GetProductsAsync(priceTableId);
        return Ok(
            ApiResponse<ListPriceTableProductsResponse>.SuccessResponse(
                res,
                "Lấy danh sách sản phẩm của bảng giá thành công"
            )
        );
    }
}
