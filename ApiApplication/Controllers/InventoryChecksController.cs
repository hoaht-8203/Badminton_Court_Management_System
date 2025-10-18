using ApiApplication.Dtos;
using ApiApplication.Dtos.InventoryCheck;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
public class InventoryChecksController(IInventoryCheckService inventoryCheckService)
    : ControllerBase
{
    private readonly IInventoryCheckService _inventoryCheckService = inventoryCheckService;

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListInventoryCheckResponse>>>> List(
        [FromQuery] ListInventoryCheckRequest request
    )
    {
        var result = await _inventoryCheckService.ListAsync(request);
        return Ok(
            ApiResponse<List<ListInventoryCheckResponse>>.SuccessResponse(
                result,
                "Lấy danh sách kiểm kê kho thành công"
            )
        );
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<DetailInventoryCheckResponse>>> Detail(int id)
    {
        var result = await _inventoryCheckService.DetailAsync(id);
        return Ok(
            ApiResponse<DetailInventoryCheckResponse>.SuccessResponse(
                result,
                "Lấy chi tiết kiểm kê kho thành công"
            )
        );
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<int>>> Create(
        [FromBody] CreateInventoryCheckRequest request
    )
    {
        var result = await _inventoryCheckService.CreateAsync(request);
        return Ok(ApiResponse<int>.SuccessResponse(result, "Tạo kiểm kê kho thành công"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(
        int id,
        [FromBody] CreateInventoryCheckRequest request
    )
    {
        await _inventoryCheckService.UpdateAsync(id, request);
        return Ok(ApiResponse<object>.SuccessResponse(new { }, "Cập nhật kiểm kê kho thành công"));
    }

    [HttpPut("{id}/cancel")]
    public async Task<ActionResult<ApiResponse<object>>> Cancel(int id)
    {
        await _inventoryCheckService.CancelAsync(id);
        return Ok(ApiResponse<object>.SuccessResponse(new { }, "Hủy phiếu kiểm kê kho thành công"));
    }

    [HttpPost("bulk-cancel")]
    public async Task<ActionResult<ApiResponse<List<int>>>> BulkCancel([FromBody] List<int> ids)
    {
        var result = await _inventoryCheckService.BulkCancelAsync(ids);
        return Ok(
            ApiResponse<List<int>>.SuccessResponse(result, "Hủy nhiều phiếu kiểm kê kho thành công")
        );
    }

    [HttpPut("{id}/complete")]
    public async Task<ActionResult<ApiResponse<object>>> Complete(int id)
    {
        await _inventoryCheckService.CompleteAsync(id);
        return Ok(
            ApiResponse<object>.SuccessResponse(new { }, "Hoàn thành kiểm kê kho thành công")
        );
    }

    [HttpPost("merge")]
    public async Task<ActionResult<ApiResponse<int>>> Merge(
        [FromBody] MergeInventoryChecksRequest request
    )
    {
        var result = await _inventoryCheckService.MergeAsync(request.InventoryCheckIds);
        return Ok(ApiResponse<int>.SuccessResponse(result, "Gộp phiếu kiểm kê kho thành công"));
    }

    [HttpGet("debug/latest")]
    public async Task<ActionResult<ApiResponse<object?>>> GetLatestInventoryChecks()
    {
        var result = await _inventoryCheckService.ListAsync(new ListInventoryCheckRequest());
        return Ok(
            ApiResponse<object?>.SuccessResponse(result, "Lấy danh sách phiếu kiểm kê gần nhất")
        );
    }
}
