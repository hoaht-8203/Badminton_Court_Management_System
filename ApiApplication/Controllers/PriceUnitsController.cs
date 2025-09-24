using ApiApplication.Dtos;
using ApiApplication.Dtos.PriceUnit;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PriceUnitsController(IPriceUnitService service) : ControllerBase
{
    private readonly IPriceUnitService _service = service;

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListPriceUnitResponse>>>> List()
    {
        var result = await _service.ListPriceUnitsAsync();
        return Ok(
            ApiResponse<List<ListPriceUnitResponse>>.SuccessResponse(
                result,
                "List price units successfully"
            )
        );
    }

    [HttpGet("detail")]
    public async Task<ActionResult<ApiResponse<DetailPriceUnitResponse>>> Detail(
        [FromQuery] DetailPriceUnitRequest request
    )
    {
        var result = await _service.DetailPriceUnitAsync(request);
        return Ok(
            ApiResponse<DetailPriceUnitResponse>.SuccessResponse(result, "Get detail successfully")
        );
    }

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<DetailPriceUnitResponse>>> Create(
        [FromBody] CreatePriceUnitRequest request
    )
    {
        var result = await _service.CreatePriceUnitAsync(request);
        return Ok(
            ApiResponse<DetailPriceUnitResponse>.SuccessResponse(result, "Create successfully")
        );
    }

    [HttpPut("update")]
    public async Task<ActionResult<ApiResponse<DetailPriceUnitResponse>>> Update(
        [FromBody] UpdatePriceUnitRequest request
    )
    {
        var result = await _service.UpdatePriceUnitAsync(request);
        return Ok(
            ApiResponse<DetailPriceUnitResponse>.SuccessResponse(result, "Update successfully")
        );
    }

    [HttpDelete("delete")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(
        [FromBody] DeletePriceUnitRequest request
    )
    {
        await _service.DeletePriceUnitAsync(request);
        return Ok(ApiResponse<bool>.SuccessResponse(true, "Delete successfully"));
    }
}
