using ApiApplication.Dtos;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ActivityController(IActivityService activityService) : ControllerBase
{
    private readonly IActivityService _activityService = activityService;

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<object?>>> CreateActivity(
        [FromBody] CreateActivityRequest request
    )
    {
        await _activityService.CreateActivityAsync(request);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "Activity created successfully"));
    }

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<ListActivityResponse>>>> GetActivities(
        [FromQuery] ListActivityRequest request
    )
    {
        var activities = await _activityService.GetActivitiesAsync(request);

        return Ok(
            ApiResponse<List<ListActivityResponse>>.SuccessResponse(
                activities,
                $"Retrieved {activities.Count} activities"
            )
        );
    }
}
