using ApiApplication.Dtos;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController(IAuthService authService) : ControllerBase
    {
        private readonly IAuthService _authService = authService;

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<CurrentUserResponse>>> Login(
            LoginRequest loginRequest
        )
        {
            var user = await _authService.LoginAsync(loginRequest);
            return Ok(ApiResponse<CurrentUserResponse>.SuccessResponse(user, "Login successfully"));
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<ApiResponse<CurrentUserResponse>>> Me()
        {
            var user = await _authService.GetCurrentUserAsync();
            return Ok(
                ApiResponse<CurrentUserResponse>.SuccessResponse(
                    user,
                    "Get current user successfully"
                )
            );
        }

        [HttpPost("refresh-token")]
        public async Task<ActionResult<ApiResponse<object?>>> RefreshToken()
        {
            var refreshToken = HttpContext.Request.Cookies["REFRESH_TOKEN"];
            await _authService.RefreshTokenAsync(refreshToken);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Refresh token successfully"));
        }
    }
}
