using ApiApplication.Dtos;
using ApiApplication.Dtos.StockOut;
using ApiApplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
public class StockOutsController(IStockOutService stockOutService) : ControllerBase
{
    private readonly IStockOutService _stockOutService = stockOutService;

    public record ListStockOutRequest(DateTime? From, DateTime? To, int? Status);

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListStockOutResponse>>>> List(
        [FromQuery] ListStockOutRequest req
    )
    {
        var result = await _stockOutService.ListAsync(req.From, req.To, req.Status);
        return Ok(
            ApiResponse<List<ListStockOutResponse>>.SuccessResponse(
                result,
                "Lấy danh sách xuất kho thành công"
            )
        );
    }

    [HttpGet("detail/{id}")]
    public async Task<ActionResult<ApiResponse<DetailStockOutResponse>>> Detail(int id)
    {
        var result = await _stockOutService.DetailAsync(id);
        return Ok(
            ApiResponse<DetailStockOutResponse>.SuccessResponse(
                result,
                "Lấy chi tiết xuất kho thành công"
            )
        );
    }

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<int>>> Create(
        [FromBody] CreateStockOutRequest request
    )
    {
        var result = await _stockOutService.CreateAsync(request);
        return Ok(ApiResponse<int>.SuccessResponse(result, "Tạo phiếu xuất kho thành công"));
    }

    [HttpPut("update/{id}")]
    public async Task<ActionResult<ApiResponse<object?>>> Update(
        int id,
        [FromBody] CreateStockOutRequest request
    )
    {
        await _stockOutService.UpdateAsync(id, request);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "Cập nhật phiếu xuất kho thành công"));
    }

    [HttpPost("complete/{id}")]
    public async Task<ActionResult<ApiResponse<object?>>> Complete(int id)
    {
        await _stockOutService.CompleteAsync(id);
        return Ok(
            ApiResponse<object?>.SuccessResponse(null, "Hoàn thành phiếu xuất kho thành công")
        );
    }

    [HttpPost("cancel/{id}")]
    public async Task<ActionResult<ApiResponse<object?>>> Cancel(int id)
    {
        await _stockOutService.CancelAsync(id);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "Hủy phiếu xuất kho thành công"));
    }

    [HttpPut("{id}/note")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateNote(
        int id,
        [FromBody] UpdateStockOutNoteRequest req
    )
    {
        await _stockOutService.UpdateNoteAsync(id, req.Note);
        return Ok(ApiResponse<object>.SuccessResponse(new { }, "Cập nhật ghi chú thành công"));
    }
}

public record UpdateStockOutNoteRequest(string Note);
