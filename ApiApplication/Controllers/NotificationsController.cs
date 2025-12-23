using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Notification;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = PolicyConstants.CustomerAccess)]
public class NotificationsController(INotificationService notificationService) : ControllerBase
{
    private readonly INotificationService _notificationService = notificationService;

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<NotificationResponseDto>>>> ListAsync(
        [FromQuery] ListNotificationRequestDto request
    )
    {
        var items = await _notificationService.ListAsync(request);
        return Ok(ApiResponse<List<NotificationResponseDto>>.SuccessResponse(items));
    }
}
