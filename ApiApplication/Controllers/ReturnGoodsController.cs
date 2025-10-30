using ApiApplication.Dtos;
using ApiApplication.Dtos.ReturnGoods;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ReturnGoodsController(IReturnGoodsService returnGoodsService) : ControllerBase
{
    private readonly IReturnGoodsService _returnGoodsService = returnGoodsService;

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListReturnGoodsResponse>>>> List(
        [FromQuery] ListReturnGoodsRequest request
    )
    {
        var result = await _returnGoodsService.ListAsync(request.From, request.To, request.Status);
        return Ok(
            ApiResponse<List<ListReturnGoodsResponse>>.SuccessResponse(
                result,
                "Lấy danh sách trả hàng thành công"
            )
        );
    }

    [HttpGet("detail/{id}")]
    public async Task<ActionResult<ApiResponse<DetailReturnGoodsResponse>>> Detail(int id)
    {
        var result = await _returnGoodsService.DetailAsync(id);
        return Ok(
            ApiResponse<DetailReturnGoodsResponse>.SuccessResponse(
                result,
                "Lấy chi tiết trả hàng thành công"
            )
        );
    }

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<int>>> Create(
        [FromBody] CreateReturnGoodsRequest request
    )
    {
        var result = await _returnGoodsService.CreateAsync(request);
        return Ok(ApiResponse<int>.SuccessResponse(result, "Tạo phiếu trả hàng thành công"));
    }

    [HttpPut("update/{id}")]
    public async Task<ActionResult<ApiResponse<object?>>> Update(
        int id,
        [FromBody] CreateReturnGoodsRequest request
    )
    {
        await _returnGoodsService.UpdateAsync(id, request);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "Cập nhật phiếu trả hàng thành công"));
    }

    [HttpPost("complete/{id}")]
    public async Task<ActionResult<ApiResponse<object?>>> Complete(int id)
    {
        await _returnGoodsService.CompleteAsync(id);
        return Ok(
            ApiResponse<object?>.SuccessResponse(null, "Hoàn thành phiếu trả hàng thành công")
        );
    }

    [HttpPost("cancel/{id}")]
    public async Task<ActionResult<ApiResponse<object?>>> Cancel(
        int id,
        [FromBody] CancelReturnGoodsRequest? request = null
    )
    {
        await _returnGoodsService.CancelAsync(id, request?.Note);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "Hủy phiếu trả hàng thành công"));
    }

    [HttpPut("{id}/note")]
    public async Task<ActionResult<ApiResponse<object?>>> UpdateNote(
        int id,
        [FromBody] CancelReturnGoodsRequest request
    )
    {
        await _returnGoodsService.UpdateNoteAsync(id, request.Note ?? string.Empty);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "Cập nhật ghi chú thành công"));
    }
}
