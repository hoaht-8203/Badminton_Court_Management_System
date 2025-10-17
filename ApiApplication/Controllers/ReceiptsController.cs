using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Receipt;
using ApiApplication.Entities;
using ApiApplication.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ReceiptsController(IReceiptService receiptService) : ControllerBase
{
    private readonly IReceiptService _service = receiptService;

    public record ListReceiptRequest(DateTime? From, DateTime? To, int? Status);

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListReceiptResponse>>>> List(
        [FromQuery] ListReceiptRequest req
    )
    {
        var list = await _service.ListAsync(req.From, req.To, req.Status);
        return Ok(ApiResponse<List<ListReceiptResponse>>.SuccessResponse(list));
    }

    [HttpGet("detail")]
    public async Task<ActionResult<ApiResponse<DetailReceiptResponse>>> Detail([FromQuery] int id)
    {
        var r = await _service.DetailAsync(id);
        return Ok(ApiResponse<DetailReceiptResponse>.SuccessResponse(r));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<int>>> Create([FromBody] CreateReceiptRequest req)
    {
        var id = await _service.CreateAsync(req);
        return Ok(ApiResponse<int>.SuccessResponse(id, "Tạo phiếu nhập thành công"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(
        int id,
        [FromBody] CreateReceiptRequest req
    )
    {
        await _service.UpdateAsync(id, req);
        return Ok(ApiResponse<object>.SuccessResponse(new { }, "Cập nhật phiếu nhập thành công"));
    }

    [HttpPut("{id}/complete")]
    public async Task<ActionResult<ApiResponse<object>>> Complete(int id)
    {
        await _service.CompleteAsync(id);
        return Ok(ApiResponse<object>.SuccessResponse(new { }, "Hoàn thành phiếu nhập thành công"));
    }

    [HttpPut("{id}/cancel")]
    public async Task<ActionResult<ApiResponse<object>>> Cancel(int id)
    {
        await _service.CancelAsync(id);
        return Ok(ApiResponse<object>.SuccessResponse(new { }, "Hủy phiếu nhập thành công"));
    }
}
