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

        [Authorize]
        [HttpGet("logout")]
        public async Task<ActionResult<ApiResponse<object?>>> Logout()
        {
            await _authService.LogoutAsync();
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Logout successfully"));
        }

        [HttpPost("refresh-token")]
        public async Task<ActionResult<ApiResponse<object?>>> RefreshToken()
        {
            var refreshToken = HttpContext.Request.Cookies["REFRESH_TOKEN"];
            await _authService.RefreshTokenAsync(refreshToken);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Refresh token successfully"));
        }

        [Authorize]
        [HttpGet("my-profile")]
        public async Task<ActionResult<ApiResponse<MyProfileResponse>>> MyProfile()
        {
            var user = await _authService.GetMyProfileAsync();
            return Ok(
                ApiResponse<MyProfileResponse>.SuccessResponse(user, "Get my profile successfully")
            );
        }

        [Authorize]
        [HttpPut("update-my-profile")]
        public async Task<ActionResult<ApiResponse<object?>>> UpdateMyProfile(
            UpdateMyProfileRequest updateMyProfileRequest
        )
        {
            await _authService.UpdateMyProfileAsync(updateMyProfileRequest);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Update my profile successfully"));
        }

        [Authorize]
        [HttpPut("update-password")]
        public async Task<ActionResult<ApiResponse<object?>>> UpdatePassword(
            UpdatePasswordRequest updatePasswordRequest
        )
        {
            var refreshToken = HttpContext.Request.Cookies["REFRESH_TOKEN"];
            await _authService.UpdatePasswordAsync(updatePasswordRequest, refreshToken);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Update password successfully"));
        }

        [HttpPost("forgot-password")]
        public async Task<ActionResult<ApiResponse<object?>>> ForgotPassword(
            ForgotPasswordRequest forgotPasswordRequest
        )
        {
            await _authService.ForgotPasswordAsync(forgotPasswordRequest);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Forgot password successfully"));
        }

        [HttpPost("validate-forgot-password")]
        public async Task<ActionResult<ApiResponse<object?>>> ValidateForgotPassword(
            ValidateForgotPasswordRequest validateForgotPasswordRequest
        )
        {
            await _authService.ValidateForgotPasswordAsync(validateForgotPasswordRequest);
            return Ok(
                ApiResponse<object?>.SuccessResponse(null, "Validate forgot password successfully")
            );
        }

        [HttpPost("verify-email")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<object?>>> VerifyEmail(
            VerifyEmailRequest request
        )
        {
            await _authService.VerifyEmailAsync(request);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Verify email successfully"));
        }

        [HttpPost("sign-up")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<CurrentUserResponse>>> SignUp(
            RegisterRequest registerRequest
        )
        {
            await _authService.UserRegisterAsync(registerRequest);

            var user = await _authService.LoginAsync(
                new LoginRequest
                {
                    Email = registerRequest.Email,
                    Password = registerRequest.Password,
                }
            );

            return Ok(
                ApiResponse<CurrentUserResponse>.SuccessResponse(user, "Sign-up successfully")
            );
        }
    }
}
