using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Helpers;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = PolicyConstants.ManagementOnly)]
public class SystemConfigController(ISystemConfigService systemConfigService) : ControllerBase
{
    private readonly ISystemConfigService _systemConfigService = systemConfigService;

    [HttpGet("{key}")]
    public async Task<ActionResult<ApiResponse<SystemConfigResponse>>> GetByKey(string key)
    {
        var result = await _systemConfigService.GetByKeyAsync(key);
        if (result == null)
            return NotFound(ApiResponse<SystemConfigResponse>.ErrorResponse("Config not found"));

        return Ok(ApiResponse<SystemConfigResponse>.SuccessResponse(result));
    }

    [HttpGet("group/{group}")]
    public async Task<ActionResult<ApiResponse<List<SystemConfigResponse>>>> GetByGroup(
        string group
    )
    {
        var result = await _systemConfigService.GetByGroupAsync(group);
        return Ok(ApiResponse<List<SystemConfigResponse>>.SuccessResponse(result));
    }

    [HttpPut("{key}")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateValue(
        string key,
        [FromBody] SystemConfigRequest request
    )
    {
        var result = await _systemConfigService.UpdateValueAsync(key, request.Value);
        if (!result)
            return NotFound(ApiResponse<bool>.ErrorResponse("Config not found"));

        return Ok(ApiResponse<bool>.SuccessResponse(result, "Update successfully"));
    }
}
