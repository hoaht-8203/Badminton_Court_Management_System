using System;
using System.Net;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Enums;
using ApiApplication.Exceptions;
using ApiApplication.Helpers;
using ApiApplication.Processors;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class AuthService(
    IAuthTokenProcessor authTokenProcessor,
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext context,
    IMapper mapper,
    IHttpContextAccessor httpContextAccessor
) : IAuthService
{
    private readonly IAuthTokenProcessor _authTokenProcessor = authTokenProcessor;
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    public async Task<CurrentUserResponse> GetCurrentUserAsync()
    {
        var principal = _httpContextAccessor.HttpContext?.User;
        if (principal?.Identity == null || !principal.Identity.IsAuthenticated)
        {
            throw new ApiException("Unauthorized", HttpStatusCode.Unauthorized);
        }

        var user =
            await _userManager.GetUserAsync(principal)
            ?? throw new ApiException("User not found", HttpStatusCode.Unauthorized);

        var roles = await _userManager.GetRolesAsync(user);

        var res = _mapper.Map<CurrentUserResponse>(user);
        res.Roles = [.. roles];
        return res;
    }

    public async Task<CurrentUserResponse> LoginAsync(LoginRequest loginRequest)
    {
        var user = await _userManager.FindByEmailAsync(loginRequest.Email);

        if (user == null || !await _userManager.CheckPasswordAsync(user, loginRequest.Password))
        {
            throw new ApiException("Email or password is incorrect", HttpStatusCode.BadRequest);
        }

        IList<string> roles = await _userManager.GetRolesAsync(user);

        var (jwtToken, expirationDateInUtc) = _authTokenProcessor.GenerateJwtToken(user, roles);
        var refreshTokenValue = _authTokenProcessor.GenerateRefreshToken();

        var refreshTokenExpirationDateInUtc = DateTime.UtcNow.AddDays(7);

        user.UserTokens.Add(
            new ApplicationUserToken
            {
                Token = refreshTokenValue,
                TokenType = TokenType.RefreshToken,
                ExpiresAtUtc = refreshTokenExpirationDateInUtc,
                UserId = user.Id,
            }
        );

        await _context.SaveChangesAsync();

        _authTokenProcessor.WriteAuthTokenAsHttpOnlyCookie(
            "ACCESS_TOKEN",
            jwtToken,
            expirationDateInUtc
        );
        _authTokenProcessor.WriteAuthTokenAsHttpOnlyCookie(
            "REFRESH_TOKEN",
            refreshTokenValue,
            refreshTokenExpirationDateInUtc
        );

        var res = _mapper.Map<CurrentUserResponse>(user);
        res.Roles = [.. roles];
        return res;
    }

    public Task LogoutAsync()
    {
        _authTokenProcessor.DeleteAuthTokenAsHttpOnlyCookie("ACCESS_TOKEN");
        _authTokenProcessor.DeleteAuthTokenAsHttpOnlyCookie("REFRESH_TOKEN");
        return Task.CompletedTask;
    }

    public async Task RefreshTokenAsync(string? refreshToken)
    {
        if (string.IsNullOrEmpty(refreshToken))
        {
            throw new ApiException("Refresh token is missing.", HttpStatusCode.BadRequest);
        }

        var userToken =
            await _context
                .ApplicationUserTokens.Include(x => x.User)
                .FirstOrDefaultAsync(x =>
                    x.Token == refreshToken && x.TokenType == TokenType.RefreshToken
                )
            ?? throw new ApiException(
                "Unable to retrieve user for refresh token",
                HttpStatusCode.BadRequest
            );
        if (userToken.ExpiresAtUtc < DateTime.UtcNow)
        {
            throw new ApiException("Refresh token is expired.", HttpStatusCode.BadRequest);
        }

        IList<string> roles = await _userManager.GetRolesAsync(userToken.User);

        var (jwtToken, expirationDateInUtc) = _authTokenProcessor.GenerateJwtToken(
            userToken.User,
            roles
        );
        var refreshTokenValue = _authTokenProcessor.GenerateRefreshToken();

        var refreshTokenExpirationDateInUtc = DateTime.UtcNow.AddDays(7);

        userToken.Token = refreshTokenValue;
        userToken.ExpiresAtUtc = refreshTokenExpirationDateInUtc;

        await _context.SaveChangesAsync();

        _authTokenProcessor.WriteAuthTokenAsHttpOnlyCookie(
            "ACCESS_TOKEN",
            jwtToken,
            expirationDateInUtc
        );
        _authTokenProcessor.WriteAuthTokenAsHttpOnlyCookie(
            "REFRESH_TOKEN",
            userToken.Token,
            refreshTokenExpirationDateInUtc
        );
    }

    public async Task UserRegisterAsync(RegisterRequest registerRequest)
    {
        var userExists = await _userManager.FindByEmailAsync(registerRequest.Email) != null;

        if (userExists)
        {
            throw new ApiException("User already exists", HttpStatusCode.BadRequest);
        }

        var user = _mapper.Map<ApplicationUser>(registerRequest);
        user.UserName = registerRequest.Email.Split('@')[0];
        user.PasswordHash = _userManager.PasswordHasher.HashPassword(
            user,
            registerRequest.Password
        );

        var result = await _userManager.CreateAsync(user);

        if (!result.Succeeded)
        {
            throw new ApiException(
                "Registration failed",
                HttpStatusCode.BadRequest,
                result.Errors.ToDictionary(x => x.Code, x => x.Description)
            );
        }

        await _userManager.AddToRoleAsync(user, RoleHelper.GetIdentityRoleName(Role.User));
    }
}
