using System;
using ApiApplication.Dtos;

namespace ApiApplication.Services;

public interface IAuthService
{
    public Task UserRegisterAsync(RegisterRequest registerRequest);
    public Task<CurrentUserResponse> LoginAsync(LoginRequest loginRequest);
    public Task RefreshTokenAsync(string? refreshToken);
    public Task<CurrentUserResponse> GetCurrentUserAsync();
    public Task LogoutAsync();
    public Task<MyProfileResponse> GetMyProfileAsync();
    public Task UpdateMyProfileAsync(UpdateMyProfileRequest updateMyProfileRequest);
    public Task UpdatePasswordAsync(
        UpdatePasswordRequest updatePasswordRequest,
        string? refreshToken
    );
}
