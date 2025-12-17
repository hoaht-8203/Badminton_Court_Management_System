using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Dtos.CourtArea;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = PolicyConstants.ManagementOnly)]
public class CourtAreasController(ICourtAreaService service) : ControllerBase
{
    private readonly ICourtAreaService _service = service;

    /// <summary>
    /// List court areas - Accessible by everyone to view court areas
    /// </summary>
    [AllowAnonymous]
    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListCourtAreaResponse>>>> List()
    {
        var result = await _service.ListCourtAreasAsync();
        return Ok(
            ApiResponse<List<ListCourtAreaResponse>>.SuccessResponse(
                result,
                "List court areas successfully"
            )
        );
    }

    /// <summary>
    /// Get court area details - Accessible by everyone
    /// </summary>
    [AllowAnonymous]
    [HttpGet("detail")]
    public async Task<ActionResult<ApiResponse<DetailCourtAreaResponse>>> Detail(
        [FromQuery] DetailCourtAreaRequest request
    )
    {
        var result = await _service.DetailCourtAreaAsync(request);
        return Ok(
            ApiResponse<DetailCourtAreaResponse>.SuccessResponse(result, "Get detail successfully")
        );
    }

    /// <summary>
    /// Create court area - Only Admin and Branch Administrator
    /// </summary>
    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<DetailCourtAreaResponse>>> Create(
        [FromBody] CreateCourtAreaRequest request
    )
    {
        var result = await _service.CreateCoutAreaAsync(request);
        return Ok(
            ApiResponse<DetailCourtAreaResponse>.SuccessResponse(result, "Create successfully")
        );
    }

    /// <summary>
    /// Update court area - Only Admin and Branch Administrator
    /// </summary>
    [HttpPut("update")]
    public async Task<ActionResult<ApiResponse<DetailCourtAreaResponse>>> Update(
        [FromBody] UpdateCourtAreaRequest request
    )
    {
        var result = await _service.UpdateCourtAreaAsync(request);
        return Ok(
            ApiResponse<DetailCourtAreaResponse>.SuccessResponse(result, "Update successfully")
        );
    }

    /// <summary>
    /// Delete court area - Only Admin and Branch Administrator
    /// </summary>
    [HttpDelete("delete")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(
        [FromBody] DeletCourtAreaRequest request
    )
    {
        await _service.DeleteCourtAreaAsync(request);
        return Ok(ApiResponse<bool>.SuccessResponse(true, "Delete successfully"));
    }
}
