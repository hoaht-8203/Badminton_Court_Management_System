using System;
using System.Net;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Dtos.User;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Enums;
using ApiApplication.Exceptions;
using ApiApplication.Extensions;
using ApiApplication.Helpers;
using ApiApplication.Sessions;
using ApiApplication.Template;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class UserService(
    ApplicationDbContext context,
    IMapper mapper,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    SignInManager<ApplicationUser> signInManager,
    ICurrentUser currentUser,
    IEmailService emailService,
    ILogger<UserService> logger
) : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager = roleManager;
    private readonly SignInManager<ApplicationUser> _signInManager = signInManager;
    private readonly ICurrentUser _currentUser = currentUser;
    private readonly IEmailService _emailService = emailService;
    private readonly ILogger<UserService> _logger = logger;

    public async Task CreateAdministratorAsync(
        CreateAdministratorRequest createAdministratorRequest
    )
    {
        var userEmailExists = await _context.ApplicationUsers.AnyAsync(x =>
            x.Email == createAdministratorRequest.Email && x.Status == ApplicationUserStatus.Active
        );

        if (userEmailExists)
        {
            throw new ApiException("Email đã được sử dụng", HttpStatusCode.BadRequest);
        }

        var userUserNameExists = await _context.ApplicationUsers.AnyAsync(x =>
            x.UserName == createAdministratorRequest.UserName
            && x.Status == ApplicationUserStatus.Active
        );

        if (userUserNameExists)
        {
            throw new ApiException("Tên người dùng đã được sử dụng", HttpStatusCode.BadRequest);
        }

        var userPhoneNumberExists = await _context.ApplicationUsers.AnyAsync(x =>
            x.PhoneNumber == createAdministratorRequest.PhoneNumber
        );
        if (userPhoneNumberExists)
        {
            throw new ApiException("Số điện thoại đã được sử dụng", HttpStatusCode.BadRequest);
        }

        var isRoleExists = await _roleManager.RoleExistsAsync(createAdministratorRequest.Role);
        if (!isRoleExists)
        {
            throw new ApiException("Vai trò không tồn tại", HttpStatusCode.BadRequest);
        }

        var user = _mapper.Map<ApplicationUser>(createAdministratorRequest);
        user.PasswordHash = _userManager.PasswordHasher.HashPassword(
            user,
            createAdministratorRequest.Password
        );

        user.CreatedAt = DateTime.UtcNow;
        user.CreatedBy = _currentUser.Username;

        var result = await _userManager.CreateAsync(user);

        if (!result.Succeeded)
        {
            var errorMessages = result.Errors.Select(e => e.Description).ToList();
            var mainMessage = errorMessages.Count > 0 
                ? $"Tạo tài khoản thất bại: {string.Join(", ", errorMessages)}" 
                : "Tạo tài khoản thất bại do lỗi không xác định";
            
            throw new ApiException(
                mainMessage,
                HttpStatusCode.BadRequest,
                result.Errors.ToDictionary(x => x.Code, x => x.Description)
            );
        }

        await _userManager.AddToRoleAsync(user, createAdministratorRequest.Role);

        // Nếu role là Customer/User, tự động tạo bản ghi Customer
        if (createAdministratorRequest.Role == IdentityRoleConstants.Customer || 
            createAdministratorRequest.Role == IdentityRoleConstants.User)
        {
            var customer = new Customer
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email!,
                PhoneNumber = createAdministratorRequest.PhoneNumber,
                DateOfBirth = createAdministratorRequest.DateOfBirth.HasValue 
                    ? DateOnly.FromDateTime(createAdministratorRequest.DateOfBirth.Value) 
                    : null,
                Address = createAdministratorRequest.Address,
                City = createAdministratorRequest.City,
                District = createAdministratorRequest.District,
                Ward = createAdministratorRequest.Ward,
                Status = CustomerStatus.Active,
            };
            _context.Customers.Add(customer);
        }

        //nếu có staffId thì gán userId cho staff
        if (createAdministratorRequest.StaffId.HasValue)
        {
            var staff = await _context.Staffs.FindAsync(createAdministratorRequest.StaffId.Value);
            if (staff != null)
            {
                staff.UserId = user.Id;
                await _context.SaveChangesAsync();
            }
        }

        //hết hạn sau 7 ngày
        var tempPasswordToken = Guid.NewGuid().ToString("N");
        _context.ApplicationUserTokens.Add(
            new ApplicationUserToken
            {
                UserId = user.Id,
                Token = tempPasswordToken,
                TokenType = TokenType.TempPassword,
                ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
            }
        );

        await _context.SaveChangesAsync();

        _emailService.SendEmailFireAndForget(
            () =>
                _emailService.SendWelcomeEmailAsync(
                    new()
                    {
                        To = user.Email!,
                        ToName = user.FullName,
                        FullName = user.FullName,
                        UserName = user.UserName!,
                        Email = user.Email!,
                        Password = createAdministratorRequest.Password,
                    }
                ),
            _logger,
            user.Email!
        );
    }

    public async Task ChangeUserStatusAsync(ChangeUserStatusRequest changeUserStatusRequest)
    {
        var user =
            await _context.ApplicationUsers.FindAsync(changeUserStatusRequest.UserId)
            ?? throw new ApiException("Người dùng không tồn tại", HttpStatusCode.BadRequest);

        var validUserStatus = ApplicationUserStatus.ValidUserStatus;
        if (!validUserStatus.Contains(changeUserStatusRequest.Status))
        {
            throw new ApiException("Trạng thái người dùng không hợp lệ", HttpStatusCode.BadRequest);
        }

        user.Status = changeUserStatusRequest.Status;

        await _userManager.UpdateSecurityStampAsync(user);

        var userRefreshTokens = await _context
            .ApplicationUserTokens.Where(t =>
                t.UserId == user.Id && t.TokenType == TokenType.RefreshToken
            )
            .ToListAsync();
        if (userRefreshTokens.Count > 0)
        {
            _context.ApplicationUserTokens.RemoveRange(userRefreshTokens);
        }

        await _context.SaveChangesAsync();
    }

    public async Task UpdateUserAsync(UpdateUserRequest updateUserRequest)
    {
        var user =
            await _context.ApplicationUsers.FindAsync(updateUserRequest.UserId)
            ?? throw new ApiException("Người dùng không tồn tại", HttpStatusCode.BadRequest);

        var emailExists = await _context.ApplicationUsers.AnyAsync(x =>
            x.Email == updateUserRequest.Email
            && x.Id != user.Id
            && x.Status == ApplicationUserStatus.Active
        );
        if (emailExists)
        {
            throw new ApiException("Email đã được sử dụng", HttpStatusCode.BadRequest);
        }

        var userNameExists = await _context.ApplicationUsers.AnyAsync(x =>
            x.UserName == updateUserRequest.UserName
            && x.Id != user.Id
            && x.Status == ApplicationUserStatus.Active
        );
        if (userNameExists)
        {
            throw new ApiException("Tên người dùng đã được sử dụng", HttpStatusCode.BadRequest);
        }

        var phoneNumberExists = await _context.ApplicationUsers.AnyAsync(x =>
            x.PhoneNumber == updateUserRequest.PhoneNumber
            && x.Id != user.Id
            && x.Status == ApplicationUserStatus.Active
        );
        if (phoneNumberExists)
        {
            throw new ApiException("Số điện thoại đã được sử dụng", HttpStatusCode.BadRequest);
        }

        _mapper.Map(updateUserRequest, user);
        if (!string.IsNullOrEmpty(updateUserRequest.Password))
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(
                user,
                token,
                updateUserRequest.Password
            );

            if (!result.Succeeded)
            {
                throw new ApiException(
                    "Đặt lại mật khẩu thất bại",
                    HttpStatusCode.BadRequest,
                    result.Errors.ToDictionary(x => x.Code, x => x.Description)
                );
            }

            await _userManager.UpdateSecurityStampAsync(user);

            var userRefreshTokens = await _context
                .ApplicationUserTokens.Where(t =>
                    t.UserId == user.Id && t.TokenType == TokenType.RefreshToken
                )
                .ToListAsync();
            if (userRefreshTokens.Count > 0)
            {
                _context.ApplicationUserTokens.RemoveRange(userRefreshTokens);
            }

            var oldTempPasswordTokens = await _context
                .ApplicationUserTokens.Where(t =>
                    t.UserId == user.Id && t.TokenType == TokenType.TempPassword
                )
                .ToListAsync();
            if (oldTempPasswordTokens.Count > 0)
            {
                _context.ApplicationUserTokens.RemoveRange(oldTempPasswordTokens);
            }

            // hết hạn sau 7 ngày
            var tempPasswordToken = Guid.NewGuid().ToString("N");
            _context.ApplicationUserTokens.Add(
                new ApplicationUserToken
                {
                    UserId = user.Id,
                    Token = tempPasswordToken,
                    TokenType = TokenType.TempPassword,
                    ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
                }
            );
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<ListAdministratorResponse>> ListAdministratorAsync(
        ListAdministratorRequest listAdministratorRequest
    )
    {
        var query = _context.ApplicationUsers.OrderByDescending(x => x.CreatedAt).AsQueryable();

        if (!string.IsNullOrEmpty(listAdministratorRequest.Keyword))
        {
            query = query.Where(x =>
                x.Email!.Contains(listAdministratorRequest.Keyword)
                || x.UserName!.Contains(listAdministratorRequest.Keyword)
                || x.FullName.Contains(listAdministratorRequest.Keyword)
            );
        }

        if (!string.IsNullOrEmpty(listAdministratorRequest.Role))
        {
            var listUserByRole = await _userManager.GetUsersInRoleAsync(
                listAdministratorRequest.Role
            );
            query = query.Where(x => listUserByRole.Contains(x));
        }

        if (!string.IsNullOrEmpty(listAdministratorRequest.Status))
        {
            query = query.Where(x => x.Status == listAdministratorRequest.Status);
        }

        var filteredUsers = await query.ToListAsync();
        var response = new List<ListAdministratorResponse>();
        foreach (var user in filteredUsers)
        {
            var roles = await _userManager.GetRolesAsync(user);
            response.Add(
                new ListAdministratorResponse
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    UserName = user.UserName!,
                    Email = user.Email!,
                    PhoneNumber = user.PhoneNumber!,
                    Roles = [.. roles],
                    Status = user.Status,
                    Address = user.Address,
                    City = user.City,
                    District = user.District,
                    Ward = user.Ward,
                    DateOfBirth = user.DateOfBirth,
                    Note = user.Note,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt,
                    CreatedBy = user.CreatedBy,
                    UpdatedBy = user.UpdatedBy,
                }
            );
        }
        return response;
    }

    public async Task<DetailAdministratorResponse> DetailAdministratorAsync(
        DetailAdministratorRequest detailAdministratorRequest
    )
    {
        var user =
            await _context.ApplicationUsers.FindAsync(detailAdministratorRequest.UserId)
            ?? throw new ApiException("Người dùng không tồn tại", HttpStatusCode.BadRequest);

        var roles = await _userManager.GetRolesAsync(user);
        var response = _mapper.Map<DetailAdministratorResponse>(user);
        response.Role = [.. roles];
        return response;
    }

    public async Task UpdateUserRolesAsync(UpdateUserRolesRequest request)
    {
        var user =
            await _context.ApplicationUsers.FindAsync(request.UserId)
            ?? throw new ApiException("Người dùng không tồn tại", HttpStatusCode.BadRequest);

        var distinctRoles = request.Roles.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        foreach (var roleName in distinctRoles)
        {
            var roleExists = await _roleManager.RoleExistsAsync(roleName);
            if (!roleExists)
            {
                throw new ApiException(
                    $"Vai trò '{roleName}' không tồn tại",
                    HttpStatusCode.BadRequest
                );
            }
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        var desiredSet = new HashSet<string>(distinctRoles, StringComparer.OrdinalIgnoreCase);
        var currentSet = new HashSet<string>(currentRoles, StringComparer.OrdinalIgnoreCase);

        var rolesToRemove = currentRoles.Where(r => !desiredSet.Contains(r)).ToList();
        var rolesToAdd = distinctRoles.Where(r => !currentSet.Contains(r)).ToList();

        if (rolesToRemove.Count > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(user, rolesToRemove);
            if (!removeResult.Succeeded)
            {
                throw new ApiException(
                    "Gỡ vai trò thất bại",
                    HttpStatusCode.BadRequest,
                    removeResult.Errors.ToDictionary(x => x.Code, x => x.Description)
                );
            }
        }

        if (rolesToAdd.Count > 0)
        {
            var addResult = await _userManager.AddToRolesAsync(user, rolesToAdd);
            if (!addResult.Succeeded)
            {
                throw new ApiException(
                    "Thêm vai trò thất bại",
                    HttpStatusCode.BadRequest,
                    addResult.Errors.ToDictionary(x => x.Code, x => x.Description)
                );
            }
        }

        await _userManager.UpdateSecurityStampAsync(user);

        var userRefreshTokens = await _context
            .ApplicationUserTokens.Where(t =>
                t.UserId == user.Id && t.TokenType == TokenType.RefreshToken
            )
            .ToListAsync();
        if (userRefreshTokens.Count > 0)
        {
            _context.ApplicationUserTokens.RemoveRange(userRefreshTokens);
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<ListUserRoleItemResponse>> ListUserRolesAsync(
        ListUserRolesRequest request
    )
    {
        var user =
            await _context.ApplicationUsers.FindAsync(request.UserId)
            ?? throw new ApiException("Người dùng không tồn tại", HttpStatusCode.BadRequest);

        var allRoles = await _roleManager.Roles.ToListAsync();
        var userRoles = await _userManager.GetRolesAsync(user);
        var assignedSet = new HashSet<string>(userRoles, StringComparer.OrdinalIgnoreCase);

        var response = new List<ListUserRoleItemResponse>();
        foreach (var role in allRoles)
        {
            response.Add(
                new ListUserRoleItemResponse
                {
                    RoleId = role.Id,
                    RoleName = role.Name!,
                    Assigned = assignedSet.Contains(role.Name!),
                }
            );
        }

        return response.OrderBy(x => x.RoleName).ToList();
    }
}
