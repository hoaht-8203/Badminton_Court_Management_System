using System;
using System.Net;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.Auth;
using ApiApplication.Dtos.Email;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Enums;
using ApiApplication.Exceptions;
using ApiApplication.Extensions;
using ApiApplication.Helpers;
using ApiApplication.Processors;
using ApiApplication.Template;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class AuthService(
    IAuthTokenProcessor authTokenProcessor,
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext context,
    IMapper mapper,
    IHttpContextAccessor httpContextAccessor,
    IEmailService emailService,
    ILogger<AuthService> logger
) : IAuthService
{
    private readonly IAuthTokenProcessor _authTokenProcessor = authTokenProcessor;
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    private readonly IEmailService _emailService = emailService;
    private readonly ILogger<AuthService> _logger = logger;

    public async Task ForgotPasswordAsync(ForgotPasswordRequest forgotPasswordRequest)
    {
        var user =
            await _userManager.FindByEmailAsync(forgotPasswordRequest.Email)
            ?? throw new ApiException("Email không tồn tại", HttpStatusCode.BadRequest);

        var otp = new Random().Next(100000, 999999).ToString();

        _context.ApplicationUserTokens.Add(
            new ApplicationUserToken
            {
                UserId = user.Id,
                Token = otp,
                TokenType = TokenType.ResetPassword,
                ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10),
            }
        );

        await _context.SaveChangesAsync();

        _emailService.SendEmailFireAndForget(
            () =>
                _emailService.SendForgotPasswordEmailAsync(
                    new SendForgotPasswordEmailAsyncRequest
                    {
                        To = user.Email!,
                        ToName = user.FullName,
                        FullName = user.FullName,
                        Token = otp,
                    }
                ),
            _logger,
            user.Email!
        );
    }

    public async Task ValidateForgotPasswordAsync(ValidateForgotPasswordRequest request)
    {
        var user =
            await _userManager.FindByEmailAsync(request.Email!)
            ?? throw new ApiException("Email không tồn tại", HttpStatusCode.BadRequest);

        var userToken =
            await _context.ApplicationUserTokens.FirstOrDefaultAsync(x =>
                x.UserId == user.Id
                && x.Token == request.Token
                && x.TokenType == TokenType.ResetPassword
            ) ?? throw new ApiException("Mã OTP không hợp lệ", HttpStatusCode.BadRequest);

        if (userToken.ExpiresAtUtc < DateTime.UtcNow)
        {
            throw new ApiException("Mã OTP đã hết hạn", HttpStatusCode.BadRequest);
        }

        _context.ApplicationUserTokens.Remove(userToken);

        var newPassword = Guid.NewGuid().ToString()[..8];

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await _userManager.ResetPasswordAsync(user, token, newPassword);

        if (!resetResult.Succeeded)
        {
            throw new ApiException("Đặt lại mật khẩu thất bại", HttpStatusCode.BadRequest);
        }

        await _userManager.UpdateSecurityStampAsync(user);

        await _context.SaveChangesAsync();

        _emailService.SendEmailFireAndForget(
            () =>
                _emailService.SendNewPasswordEmailAsync(
                    new SendNewPasswordEmailAsyncRequest
                    {
                        To = user.Email!,
                        ToName = user.FullName,
                        FullName = user.FullName,
                        NewPassword = newPassword,
                    }
                ),
            _logger,
            user.Email!
        );
    }

    public async Task VerifyEmailAsync(VerifyEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Token))
        {
            throw new ApiException("Email hoặc token không hợp lệ", HttpStatusCode.BadRequest);
        }

        var user =
            await _userManager.FindByEmailAsync(request.Email!)
            ?? throw new ApiException("Email không tồn tại", HttpStatusCode.BadRequest);

        var userToken =
            await _context.ApplicationUserTokens.FirstOrDefaultAsync(x =>
                x.UserId == user.Id
                && x.Token == request.Token
                && x.TokenType == TokenType.EmailConfirm
            )
            ?? throw new ApiException("Mã xác thực email không hợp lệ", HttpStatusCode.BadRequest);

        if (userToken.ExpiresAtUtc < DateTime.UtcNow)
        {
            throw new ApiException("Mã xác thực email đã hết hạn", HttpStatusCode.BadRequest);
        }

        user.EmailConfirmed = true;
        await _userManager.UpdateAsync(user);

        _context.ApplicationUserTokens.Remove(userToken);
        await _context.SaveChangesAsync();
    }

    public async Task<CurrentUserResponse> GetCurrentUserAsync()
    {
        var principal = _httpContextAccessor.HttpContext?.User;
        if (principal?.Identity == null || !principal.Identity.IsAuthenticated)
        {
            throw new ApiException("Không được phép truy cập", HttpStatusCode.Unauthorized);
        }

        var user =
            await _userManager.GetUserAsync(principal)
            ?? throw new ApiException("Không tìm thấy tài khoản", HttpStatusCode.Unauthorized);

        var roles = await _userManager.GetRolesAsync(user);

        var res = _mapper.Map<CurrentUserResponse>(user);
        res.Roles = [.. roles];
        return res;
    }

    public async Task<MyProfileResponse> GetMyProfileAsync()
    {
        var principal = _httpContextAccessor.HttpContext?.User;
        if (principal?.Identity == null || !principal.Identity.IsAuthenticated)
        {
            throw new ApiException("Không được phép truy cập", HttpStatusCode.Unauthorized);
        }

        var user =
            await _userManager.GetUserAsync(principal)
            ?? throw new ApiException("Không tìm thấy tài khoản", HttpStatusCode.Unauthorized);

        var roles = await _userManager.GetRolesAsync(user);
        var response = _mapper.Map<MyProfileResponse>(user);
        response.Roles = [.. roles];
        return response;
    }

    public async Task<CurrentUserResponse> LoginAsync(LoginRequest loginRequest)
    {
        var user = await _userManager.FindByEmailAsync(loginRequest.Email);

        if (user == null || !await _userManager.CheckPasswordAsync(user, loginRequest.Password))
        {
            throw new ApiException(
                "Email hoặc mật khẩu không chính xác",
                HttpStatusCode.BadRequest
            );
        }

        if (user.Status == ApplicationUserStatus.Inactive)
        {
            throw new ApiException(
                "Tài khoản dừng hoạt động không thể đăng nhập, vui lòng liên hệ với quản trị viên để được hỗ trợ.",
                HttpStatusCode.BadRequest
            );
        }

        var tempPasswordToken = await _context.ApplicationUserTokens.FirstOrDefaultAsync(x =>
            x.UserId == user.Id
            && x.TokenType == TokenType.TempPassword
            && x.ExpiresAtUtc > DateTime.UtcNow
        );

        if (tempPasswordToken != null)
        {
            _logger.LogWarning(
                "User {UserId} ({Email}) đang đăng nhập bằng password tạm thời. Token hết hạn: {ExpiresAt}",
                user.Id,
                user.Email,
                tempPasswordToken.ExpiresAtUtc
            );
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
            throw new ApiException("Mã refresh token không tồn tại.", HttpStatusCode.BadRequest);
        }

        var userToken =
            await _context
                .ApplicationUserTokens.Include(x => x.User)
                .FirstOrDefaultAsync(x =>
                    x.Token == refreshToken && x.TokenType == TokenType.RefreshToken
                )
            ?? throw new ApiException(
                "Không thể lấy thông tin người dùng cho refresh token",
                HttpStatusCode.BadRequest
            );
        if (userToken.ExpiresAtUtc < DateTime.UtcNow)
        {
            throw new ApiException("Refresh token đã hết hạn.", HttpStatusCode.BadRequest);
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

    public async Task UpdateMyProfileAsync(UpdateMyProfileRequest updateMyProfileRequest)
    {
        var principal = _httpContextAccessor.HttpContext?.User;
        if (principal?.Identity == null || !principal.Identity.IsAuthenticated)
        {
            throw new ApiException("Không được phép truy cập", HttpStatusCode.Unauthorized);
        }

        var user =
            await _userManager.GetUserAsync(principal)
            ?? throw new ApiException("Không tìm thấy tài khoản", HttpStatusCode.Unauthorized);

        if (user.Status == ApplicationUserStatus.Inactive)
        {
            throw new ApiException(
                "Tài khoản dừng hoạt động không thể cập nhật thông tin",
                HttpStatusCode.BadRequest
            );
        }

        _mapper.Map(updateMyProfileRequest, user);
        await _userManager.UpdateAsync(user);
    }

    public async Task UpdatePasswordAsync(
        UpdatePasswordRequest updatePasswordRequest,
        string? refreshToken
    )
    {
        if (string.IsNullOrEmpty(refreshToken))
        {
            throw new ApiException("Mã refresh token không tồn tại.", HttpStatusCode.BadRequest);
        }

        var principal = _httpContextAccessor.HttpContext?.User;
        if (principal?.Identity == null || !principal.Identity.IsAuthenticated)
        {
            throw new ApiException("Không được phép truy cập", HttpStatusCode.Unauthorized);
        }

        var user =
            await _userManager.GetUserAsync(principal)
            ?? throw new ApiException("Không tìm thấy tài khoản", HttpStatusCode.Unauthorized);

        if (user.Status == ApplicationUserStatus.Inactive)
        {
            throw new ApiException(
                "Tài khoản dừng hoạt động không thể cập nhật mật khẩu",
                HttpStatusCode.BadRequest
            );
        }

        var result = await _userManager.ChangePasswordAsync(
            user,
            updatePasswordRequest.OldPassword,
            updatePasswordRequest.NewPassword
        );

        if (!result.Succeeded)
        {
            throw new ApiException(
                "Cập nhật mật khẩu thất bại",
                HttpStatusCode.BadRequest,
                result.Errors.ToDictionary(x => x.Code, x => x.Description)
            );
        }

        var tempPasswordTokens = await _context
            .ApplicationUserTokens.Where(x =>
                x.UserId == user.Id && x.TokenType == TokenType.TempPassword
            )
            .ToListAsync();
        if (tempPasswordTokens.Count > 0)
        {
            _context.ApplicationUserTokens.RemoveRange(tempPasswordTokens);
        }

        var roles = await _userManager.GetRolesAsync(user);

        var (jwtToken, expirationDateInUtc) = _authTokenProcessor.GenerateJwtToken(user, roles);
        var refreshTokenValue = _authTokenProcessor.GenerateRefreshToken();

        var refreshTokenExpirationDateInUtc = DateTime.UtcNow.AddDays(7);

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

        var userToken =
            await _context
                .ApplicationUserTokens.Include(x => x.User)
                .FirstOrDefaultAsync(x =>
                    x.Token == refreshToken && x.TokenType == TokenType.RefreshToken
                )
            ?? throw new ApiException(
                "Không thể lấy thông tin người dùng cho refresh token",
                HttpStatusCode.BadRequest
            );
        if (userToken != null)
        {
            userToken.Token = refreshTokenValue;
            userToken.ExpiresAtUtc = refreshTokenExpirationDateInUtc;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<CurrentUserResponse> UserRegisterAsync(RegisterRequest registerRequest)
    {
        var userExists = await _userManager.FindByEmailAsync(registerRequest.Email) != null;

        if (userExists)
        {
            throw new ApiException(
                "Email hoặc tên đăng nhập đã tồn tại",
                HttpStatusCode.BadRequest
            );
        }

        var userNameExists = await _userManager.FindByNameAsync(registerRequest.UserName) != null;
        if (userNameExists)
        {
            throw new ApiException("Tên đăng nhập đã tồn tại", HttpStatusCode.BadRequest);
        }

        var user = _mapper.Map<ApplicationUser>(registerRequest);
        user.UserName = registerRequest.UserName;
        user.PasswordHash = _userManager.PasswordHasher.HashPassword(
            user,
            registerRequest.Password
        );

        var result = await _userManager.CreateAsync(user);

        if (!result.Succeeded)
        {
            throw new ApiException(
                "Đăng ký thất bại",
                HttpStatusCode.BadRequest,
                result.Errors.ToDictionary(x => x.Code, x => x.Description)
            );
        }

        await _userManager.AddToRoleAsync(user, RoleHelper.GetIdentityRoleName(Role.User));

        // gen otp with six number
        var otp = new Random().Next(100000, 999999).ToString();

        _context.ApplicationUserTokens.Add(
            new ApplicationUserToken
            {
                UserId = user.Id,
                Token = otp,
                TokenType = TokenType.EmailConfirm,
                ExpiresAtUtc = DateTime.UtcNow.AddDays(1),
            }
        );

        await _context.SaveChangesAsync();

        _emailService.SendEmailFireAndForget(
            () =>
                _emailService.SendVerifyEmailAsync(
                    new SendVerifyEmailAsyncRequest
                    {
                        To = user.Email!,
                        ToName = user.FullName,
                        FullName = user.FullName,
                        Token = otp,
                        ExpiresAt = "24 giờ",
                    }
                ),
            _logger,
            user.Email!
        );

        var roles = await _userManager.GetRolesAsync(user);
        return new CurrentUserResponse
        {
            UserId = user.Id,
            UserName = user.UserName,
            FullName = user.FullName,
            Email = user.Email!,
            EmailConfirmed = user.EmailConfirmed,
            AvatarUrl = user.AvatarUrl,
            Roles = roles.ToList(),
        };
    }
}
