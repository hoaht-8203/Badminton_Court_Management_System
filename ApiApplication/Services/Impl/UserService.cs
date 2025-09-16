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
using ApiApplication.Sessions;
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
    ICurrentUser currentUser
) : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager = roleManager;
    private readonly SignInManager<ApplicationUser> _signInManager = signInManager;
    private readonly ICurrentUser _currentUser = currentUser;

    public async Task CreateAdministratorAsync(
        CreateAdministratorRequest createAdministratorRequest
    )
    {
        var userEmailExists = await _context.ApplicationUsers.AnyAsync(x =>
            x.Email == createAdministratorRequest.Email && x.Status == ApplicationUserStatus.Active
        );

        if (userEmailExists)
        {
            throw new ApiException("User email already exists", HttpStatusCode.BadRequest);
        }

        var userUserNameExists = await _context.ApplicationUsers.AnyAsync(x =>
            x.UserName == createAdministratorRequest.UserName
            && x.Status == ApplicationUserStatus.Active
        );

        if (userUserNameExists)
        {
            throw new ApiException("User user name already exists", HttpStatusCode.BadRequest);
        }

        var userPhoneNumberExists = await _context.ApplicationUsers.AnyAsync(x =>
            x.PhoneNumber == createAdministratorRequest.PhoneNumber
        );
        if (userPhoneNumberExists)
        {
            throw new ApiException("User phone number already exists", HttpStatusCode.BadRequest);
        }

        var isRoleExists = await _roleManager.RoleExistsAsync(
            RoleHelper.GetIdentityRoleName(Role.Admin)
        );
        if (!isRoleExists)
        {
            throw new ApiException("Role not found", HttpStatusCode.BadRequest);
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
            throw new ApiException(
                "Registration failed",
                HttpStatusCode.BadRequest,
                result.Errors.ToDictionary(x => x.Code, x => x.Description)
            );
        }

        await _userManager.AddToRoleAsync(user, RoleHelper.GetIdentityRoleName(Role.Admin));
    }

    public async Task ChangeUserStatusAsync(ChangeUserStatusRequest changeUserStatusRequest)
    {
        var user =
            await _context.ApplicationUsers.FindAsync(changeUserStatusRequest.UserId)
            ?? throw new ApiException("User not found", HttpStatusCode.BadRequest);

        var validUserStatus = ApplicationUserStatus.ValidUserStatus;
        if (!validUserStatus.Contains(changeUserStatusRequest.Status))
        {
            throw new ApiException("Invalid user status", HttpStatusCode.BadRequest);
        }

        user.Status = changeUserStatusRequest.Status;

        await _context.SaveChangesAsync();
    }

    public async Task UpdateUserAsync(UpdateUserRequest updateUserRequest)
    {
        var user =
            await _context.ApplicationUsers.FindAsync(updateUserRequest.UserId)
            ?? throw new ApiException("User not found", HttpStatusCode.BadRequest);

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
                    "Reset password failed",
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
                    Role = [.. roles],
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
            ?? throw new ApiException("User not found", HttpStatusCode.BadRequest);

        var roles = await _userManager.GetRolesAsync(user);
        var response = _mapper.Map<DetailAdministratorResponse>(user);
        response.Role = [.. roles];
        return response;
    }
}
