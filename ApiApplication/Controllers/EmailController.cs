using ApiApplication.Dtos;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EmailController(IEmailService emailService) : ControllerBase
{
    private readonly IEmailService _emailService = emailService;

    [Authorize]
    [HttpPost("test-configuration")]
    public async Task<ActionResult<ApiResponse<EmailResponse>>> TestEmailConfiguration()
    {
        var result = await _emailService.TestEmailConfigurationAsync();
        return Ok(
            ApiResponse<EmailResponse>.SuccessResponse(result, "Email configuration test completed")
        );
    }
}

public class SendWelcomeEmailRequest
{
    public string To { get; set; } = string.Empty;
    public string ToName { get; set; } = string.Empty;
    public string LoginName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class SendPasswordResetEmailRequest
{
    public string To { get; set; } = string.Empty;
    public string ToName { get; set; } = string.Empty;
    public string ResetLink { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 30;
}

public class SendNotificationEmailRequest
{
    public string To { get; set; } = string.Empty;
    public string ToName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ActionLink { get; set; }
    public string? ActionText { get; set; }
}
