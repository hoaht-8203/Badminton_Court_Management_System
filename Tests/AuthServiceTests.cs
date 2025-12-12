using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.Auth;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Mappings;
using ApiApplication.Processors;
using ApiApplication.Services;
using ApiApplication.Services.Impl;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using AutoMapper.Configuration;
using Tests;

namespace Tests;

[TestClass]
public class AuthServiceTests
{
    private ApplicationDbContext _context = null!;
    private Mock<UserManager<ApplicationUser>> _userManagerMock = null!;
    private Mock<IAuthTokenProcessor> _authTokenProcessorMock = null!;
    private Mock<IHttpContextAccessor> _httpContextAccessorMock = null!;
    private Mock<IEmailService> _emailServiceMock = null!;
    private Mock<ILogger<AuthService>> _loggerMock = null!;
    private Mock<ICurrentUser> _currentUserMock = null!;
    private IMapper _mapper = null!;
    private AuthService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, _currentUserMock.Object);

        var store = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            store.Object,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!
        );

        _authTokenProcessorMock = new Mock<IAuthTokenProcessor>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<AuthService>>();

        _mapper = TestHelpers.BuildMapper();

        _sut = new AuthService(
            _authTokenProcessorMock.Object,
            _userManagerMock.Object,
            _context,
            _mapper,
            _httpContextAccessorMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object
        );
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    // FUNC01: UserRegisterAsync
    [TestMethod]
    public async Task FUNC01_TC01_UserRegisterAsync_Success_ShouldCreateUserAndCustomer()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "test@example.com",
            UserName = "testuser",
            Password = "Test123!@#",
            FullName = "Test User",
            PhoneNumber = "0123456789",
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);
        _userManagerMock.Setup(x => x.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(new List<string> { "User" });
        // PasswordHasher is a property, cannot mock directly - will use actual implementation

        // Act
        var result = await _sut.UserRegisterAsync(request);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(request.Email, result.Email);
        Assert.AreEqual(request.UserName, result.UserName);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        Assert.IsNotNull(user);
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == user.Id);
        Assert.IsNotNull(customer);
        var token = await _context.ApplicationUserTokens.FirstOrDefaultAsync(t => t.UserId == user.Id);
        Assert.IsNotNull(token);
        Assert.AreEqual(TokenType.EmailConfirm, token.TokenType);
    }

    [TestMethod]
    public async Task FUNC01_TC02_UserRegisterAsync_EmailExists_ShouldThrowException()
    {
        // Arrange
        var existingUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "existing@example.com",
            UserName = "existinguser",
            FullName = "Existing User",
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(existingUser);
        await _context.SaveChangesAsync();

        var request = new RegisterRequest
        {
            Email = "existing@example.com",
            UserName = "newuser",
            Password = "Test123!@#",
            FullName = "New User",
            PhoneNumber = "0123456789",
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync(existingUser);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.UserRegisterAsync(request));
    }

    [TestMethod]
    public async Task FUNC01_TC03_UserRegisterAsync_UserNameExists_ShouldThrowException()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "new@example.com",
            UserName = "existinguser",
            Password = "Test123!@#",
            FullName = "New User",
            PhoneNumber = "0123456789",
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);
        _userManagerMock.Setup(x => x.FindByNameAsync(It.IsAny<string>())).ReturnsAsync(new ApplicationUser
        {
            FullName = "Test User",
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        });

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.UserRegisterAsync(request));
    }

    [TestMethod]
    public async Task FUNC01_TC04_UserRegisterAsync_CreateUserFails_ShouldThrowException()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "test@example.com",
            UserName = "testuser",
            Password = "Test123!@#",
            FullName = "Test User",
            PhoneNumber = "0123456789",
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);
        _userManagerMock.Setup(x => x.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Code = "Error", Description = "Failed" }));

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.UserRegisterAsync(request));
    }

    [TestMethod]
    public async Task FUNC01_TC05_UserRegisterAsync_WithOptionalFields_ShouldCreateUserSuccessfully()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "test@example.com",
            UserName = "testuser",
            Password = "Test123!@#",
            FullName = "Test User",
            PhoneNumber = "0123456789",
            DateOfBirth = DateOnly.FromDateTime(DateTime.Now.AddYears(-25)),
            Address = "123 Test St",
            City = "Test City",
            District = "Test District",
            Ward = "Test Ward",
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);
        _userManagerMock.Setup(x => x.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(new List<string> { "User" });

        // Act
        var result = await _sut.UserRegisterAsync(request);

        // Assert
        Assert.IsNotNull(result);
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email == request.Email);
        Assert.IsNotNull(customer);
        Assert.AreEqual(request.DateOfBirth, customer.DateOfBirth);
        Assert.AreEqual(request.Address, customer.Address);
    }

    // FUNC02: LoginAsync
    [TestMethod]
    public async Task FUNC02_TC01_LoginAsync_Success_ShouldReturnUserWithTokens()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            FullName = "Test User",
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var request = new LoginRequest { Email = "test@example.com", Password = "password123" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(true);
        _userManagerMock.Setup(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(new List<string> { "User" });
        _authTokenProcessorMock.Setup(x => x.GenerateJwtToken(It.IsAny<ApplicationUser>(), It.IsAny<IList<string>>()))
            .Returns(("jwt_token", DateTime.UtcNow.AddHours(1)));
        _authTokenProcessorMock.Setup(x => x.GenerateRefreshToken()).Returns("refresh_token");

        // Act
        var result = await _sut.LoginAsync(request);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(user.Email, result.Email);
        var token = await _context.ApplicationUserTokens.FirstOrDefaultAsync(t => t.UserId == user.Id);
        Assert.IsNotNull(token);
        Assert.AreEqual(TokenType.RefreshToken, token.TokenType);
    }

    [TestMethod]
    public async Task FUNC02_TC02_LoginAsync_InvalidCredentials_ShouldThrowException()
    {
        // Arrange
        var request = new LoginRequest { Email = "test@example.com", Password = "wrongpassword" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.LoginAsync(request));
    }

    [TestMethod]
    public async Task FUNC02_TC03_LoginAsync_WrongPassword_ShouldThrowException()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            FullName = "Test User",
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var request = new LoginRequest { Email = "test@example.com", Password = "wrongpassword" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(false);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.LoginAsync(request));
    }

    [TestMethod]
    public async Task FUNC02_TC04_LoginAsync_InactiveUser_ShouldThrowException()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            FullName = "Test User",
            Status = ApplicationUserStatus.Inactive,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var request = new LoginRequest { Email = "test@example.com", Password = "password123" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(true);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.LoginAsync(request));
    }

    [TestMethod]
    public async Task FUNC02_TC05_LoginAsync_WithTempPassword_ShouldLogWarning()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            FullName = "Test User",
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);

        var tempToken = new ApplicationUserToken
        {
            UserId = user.Id,
            Token = "temp_token",
            TokenType = TokenType.TempPassword,
            ExpiresAtUtc = DateTime.UtcNow.AddHours(1),
        };
        await _context.ApplicationUserTokens.AddAsync(tempToken);
        await _context.SaveChangesAsync();

        var request = new LoginRequest { Email = "test@example.com", Password = "password123" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(true);
        _userManagerMock.Setup(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(new List<string> { "User" });
        _authTokenProcessorMock.Setup(x => x.GenerateJwtToken(It.IsAny<ApplicationUser>(), It.IsAny<IList<string>>()))
            .Returns(("jwt_token", DateTime.UtcNow.AddHours(1)));
        _authTokenProcessorMock.Setup(x => x.GenerateRefreshToken()).Returns("refresh_token");

        // Act
        await _sut.LoginAsync(request);

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()
            ),
            Times.Once
        );
    }

    // FUNC03: UpdatePasswordAsync
    [TestMethod]
    public async Task FUNC03_TC01_UpdatePasswordAsync_Success_ShouldUpdatePassword()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            FullName = "Test User",
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);

        var refreshToken = new ApplicationUserToken
        {
            UserId = user.Id,
            Token = "refresh_token",
            TokenType = TokenType.RefreshToken,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
        };
        await _context.ApplicationUserTokens.AddAsync(refreshToken);
        await _context.SaveChangesAsync();

        var request = new UpdatePasswordRequest
        {
            OldPassword = "oldpassword",
            NewPassword = "newpassword123",
        };

        var claimsPrincipal = new ClaimsPrincipal(
            new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()) })
        );
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = claimsPrincipal });
        _userManagerMock.Setup(x => x.GetUserAsync(It.IsAny<ClaimsPrincipal>())).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.ChangePasswordAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        await _sut.UpdatePasswordAsync(request, "refresh_token");

        // Assert
        var tokens = await _context.ApplicationUserTokens.Where(t => t.UserId == user.Id && t.TokenType == TokenType.RefreshToken).ToListAsync();
        Assert.AreEqual(0, tokens.Count);
    }

    [TestMethod]
    public async Task FUNC03_TC02_UpdatePasswordAsync_NoRefreshToken_ShouldThrowException()
    {
        // Arrange
        var request = new UpdatePasswordRequest
        {
            OldPassword = "oldpassword",
            NewPassword = "newpassword123",
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.UpdatePasswordAsync(request, null));
    }

    [TestMethod]
    public async Task FUNC03_TC03_UpdatePasswordAsync_InvalidRefreshToken_ShouldThrowException()
    {
        // Arrange
        var request = new UpdatePasswordRequest
        {
            OldPassword = "oldpassword",
            NewPassword = "newpassword123",
        };

        var claimsPrincipal = new ClaimsPrincipal(new ClaimsIdentity());
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = claimsPrincipal });

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.UpdatePasswordAsync(request, "invalid_token"));
    }

    [TestMethod]
    public async Task FUNC03_TC04_UpdatePasswordAsync_InactiveUser_ShouldThrowException()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            FullName = "Test User",
            Status = ApplicationUserStatus.Inactive,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var request = new UpdatePasswordRequest
        {
            OldPassword = "oldpassword",
            NewPassword = "newpassword123",
        };

        var claimsPrincipal = new ClaimsPrincipal(
            new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()) })
        );
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = claimsPrincipal });
        _userManagerMock.Setup(x => x.GetUserAsync(It.IsAny<ClaimsPrincipal>())).ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.UpdatePasswordAsync(request, "refresh_token"));
    }

    [TestMethod]
    public async Task FUNC03_TC05_UpdatePasswordAsync_PasswordChangeFails_ShouldThrowException()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            FullName = "Test User",
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);

        var refreshToken = new ApplicationUserToken
        {
            UserId = user.Id,
            Token = "refresh_token",
            TokenType = TokenType.RefreshToken,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
        };
        await _context.ApplicationUserTokens.AddAsync(refreshToken);
        await _context.SaveChangesAsync();

        var request = new UpdatePasswordRequest
        {
            OldPassword = "oldpassword",
            NewPassword = "newpassword123",
        };

        var claimsPrincipal = new ClaimsPrincipal(
            new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()) })
        );
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = claimsPrincipal });
        _userManagerMock.Setup(x => x.GetUserAsync(It.IsAny<ClaimsPrincipal>())).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.ChangePasswordAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Code = "Error", Description = "Failed" }));

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.UpdatePasswordAsync(request, "refresh_token"));
    }

    // FUNC04: ForgotPasswordAsync
    [TestMethod]
    public async Task FUNC04_TC01_ForgotPasswordAsync_Success_ShouldCreateResetToken()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            FullName = "Test User",
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var request = new ForgotPasswordRequest { Email = "test@example.com" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GeneratePasswordResetTokenAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync("reset_token");
        _userManagerMock.Setup(x => x.ResetPasswordAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.UpdateSecurityStampAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        await _sut.ForgotPasswordAsync(request);

        // Assert
        var token = await _context.ApplicationUserTokens.FirstOrDefaultAsync(t => t.UserId == user.Id && t.TokenType == TokenType.ResetPassword);
        Assert.IsNotNull(token);
        Assert.IsTrue(token.ExpiresAtUtc > DateTime.UtcNow);
    }

    [TestMethod]
    public async Task FUNC04_TC02_ForgotPasswordAsync_EmailNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new ForgotPasswordRequest { Email = "nonexistent@example.com" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.ForgotPasswordAsync(request));
    }

    [TestMethod]
    public async Task FUNC04_TC03_ForgotPasswordAsync_ResetPasswordFails_ShouldThrowException()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            FullName = "Test User",
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var request = new ForgotPasswordRequest { Email = "test@example.com" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.GeneratePasswordResetTokenAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync("reset_token");
        _userManagerMock.Setup(x => x.ResetPasswordAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Code = "Error", Description = "Failed" }));

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.ForgotPasswordAsync(request));
    }

    // FUNC05: VerifyEmailAsync
    [TestMethod]
    public async Task FUNC05_TC01_VerifyEmailAsync_Success_ShouldConfirmEmailAndCreateCustomer()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            FullName = "Test User",
            EmailConfirmed = false,
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);

        var token = new ApplicationUserToken
        {
            UserId = user.Id,
            Token = "123456",
            TokenType = TokenType.EmailConfirm,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(1),
        };
        await _context.ApplicationUserTokens.AddAsync(token);
        await _context.SaveChangesAsync();

        var request = new VerifyEmailRequest { Email = "test@example.com", Token = "123456" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>())).ReturnsAsync(IdentityResult.Success);

        // Act
        await _sut.VerifyEmailAsync(request);

        // Assert
        var updatedUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == user.Id);
        Assert.IsNotNull(updatedUser);
        Assert.IsTrue(updatedUser.EmailConfirmed);
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == user.Id);
        Assert.IsNotNull(customer);
        var removedToken = await _context.ApplicationUserTokens.FirstOrDefaultAsync(t => t.Id == token.Id);
        Assert.IsNull(removedToken);
    }

    [TestMethod]
    public async Task FUNC05_TC02_VerifyEmailAsync_InvalidEmail_ShouldThrowException()
    {
        // Arrange
        var request = new VerifyEmailRequest { Email = "", Token = "123456" };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.VerifyEmailAsync(request));
    }

    [TestMethod]
    public async Task FUNC05_TC03_VerifyEmailAsync_EmailNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new VerifyEmailRequest { Email = "nonexistent@example.com", Token = "123456" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((ApplicationUser?)null);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.VerifyEmailAsync(request));
    }

    [TestMethod]
    public async Task FUNC05_TC04_VerifyEmailAsync_InvalidToken_ShouldThrowException()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            FullName = "Test User",
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var request = new VerifyEmailRequest { Email = "test@example.com", Token = "wrongtoken" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.VerifyEmailAsync(request));
    }

    [TestMethod]
    public async Task FUNC05_TC05_VerifyEmailAsync_ExpiredToken_ShouldThrowException()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            FullName = "Test User",
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);

        var token = new ApplicationUserToken
        {
            UserId = user.Id,
            Token = "123456",
            TokenType = TokenType.EmailConfirm,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(-1),
        };
        await _context.ApplicationUserTokens.AddAsync(token);
        await _context.SaveChangesAsync();

        var request = new VerifyEmailRequest { Email = "test@example.com", Token = "123456" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.VerifyEmailAsync(request));
    }

    [TestMethod]
    public async Task FUNC05_TC06_VerifyEmailAsync_UserAlreadyHasCustomer_ShouldNotCreateDuplicate()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "testuser",
            FullName = "Test User",
            EmailConfirmed = false,
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);

        var existingCustomer = new Customer
        {
            Id = 1,
            UserId = user.Id,
            FullName = "Test User",
            Email = "test@example.com",
            PhoneNumber = "0123456789",
            Status = CustomerStatus.Active,
        };
        await _context.Customers.AddAsync(existingCustomer);

        var token = new ApplicationUserToken
        {
            UserId = user.Id,
            Token = "123456",
            TokenType = TokenType.EmailConfirm,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(1),
        };
        await _context.ApplicationUserTokens.AddAsync(token);
        await _context.SaveChangesAsync();

        var request = new VerifyEmailRequest { Email = "test@example.com", Token = "123456" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>())).ReturnsAsync(IdentityResult.Success);

        // Act
        await _sut.VerifyEmailAsync(request);

        // Assert
        var customers = await _context.Customers.Where(c => c.UserId == user.Id).ToListAsync();
        Assert.AreEqual(1, customers.Count);
    }
}

