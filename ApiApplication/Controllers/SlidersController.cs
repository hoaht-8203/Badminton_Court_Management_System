using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Slider;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = PolicyConstants.ManagementOnly)]
public class SlidersController(ISliderService service) : ControllerBase
{
    private readonly ISliderService _service = service;

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListSliderResponse>>>> List()
    {
        var result = await _service.ListSlidersAsync();
        return Ok(
            ApiResponse<List<ListSliderResponse>>.SuccessResponse(
                result,
                "List sliders successfully"
            )
        );
    }

    [AllowAnonymous]
    [HttpGet("users/list")]
    public async Task<ActionResult<ApiResponse<List<ListSliderResponse>>>> UserList()
    {
        var result = await _service.ListSlidersAsync();
        return Ok(
            ApiResponse<List<ListSliderResponse>>.SuccessResponse(
                result,
                "List sliders successfully"
            )
        );
    }

    [HttpGet("detail")]
    public async Task<ActionResult<ApiResponse<DetailSliderResponse>>> Detail(
        [FromQuery] DetailSliderRequest request
    )
    {
        var result = await _service.DetailSliderAsync(request);
        return Ok(
            ApiResponse<DetailSliderResponse>.SuccessResponse(result, "Get detail successfully")
        );
    }

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<DetailSliderResponse>>> Create(
        [FromBody] CreateSliderRequest request
    )
    {
        var result = await _service.CreateSliderAsync(request);
        return Ok(ApiResponse<DetailSliderResponse>.SuccessResponse(result, "Create successfully"));
    }

    [HttpPut("update")]
    public async Task<ActionResult<ApiResponse<DetailSliderResponse>>> Update(
        [FromBody] UpdateSliderRequest request
    )
    {
        var result = await _service.UpdateSliderAsync(request);
        return Ok(ApiResponse<DetailSliderResponse>.SuccessResponse(result, "Update successfully"));
    }

    [HttpDelete("delete")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(
        [FromQuery] DeleteSliderRequest request
    )
    {
        await _service.DeleteSliderAsync(request);
        return Ok(ApiResponse<bool>.SuccessResponse(true, "Delete successfully"));
    }
}
