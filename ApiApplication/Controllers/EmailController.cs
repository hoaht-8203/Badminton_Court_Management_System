using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Email;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = PolicyConstants.AdminOnly)]
public class EmailController(IEmailService emailService) : ControllerBase
{
    private readonly IEmailService _emailService = emailService;

    [HttpPost("test-configuration")]
    public async Task<ActionResult<ApiResponse<EmailResponse>>> TestEmailConfiguration()
    {
        var result = await _emailService.TestEmailConfigurationAsync();
        return Ok(
            ApiResponse<EmailResponse>.SuccessResponse(result, "Email configuration test completed")
        );
    }
}
