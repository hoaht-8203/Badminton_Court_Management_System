using System;
using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Role;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class RoleService(
    ApplicationDbContext context,
    IMapper mapper,
    RoleManager<IdentityRole<Guid>> roleManager,
    UserManager<ApplicationUser> userManager
) : IRoleService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager = roleManager;
    private readonly UserManager<ApplicationUser> _userManager = userManager;

    public async Task CreateRoleAsync(CreateRoleRequest createRoleRequest)
    {
        var existedRoleName = await _roleManager.FindByNameAsync(createRoleRequest.RoleName);
        if (existedRoleName != null)
        {
            throw new ApiException("Tên vai trò đã tồn tại", HttpStatusCode.BadRequest);
        }

        var role = _mapper.Map<IdentityRole<Guid>>(createRoleRequest);
        await _roleManager.CreateAsync(role);
    }

    public async Task DeleteRoleAsync(DeleteRoleRequest deleteRoleRequest)
    {
        var role =
            await _roleManager.FindByIdAsync(deleteRoleRequest.RoleId.ToString())
            ?? throw new ApiException("Không tìm thấy vai trò", HttpStatusCode.BadRequest);

        var isRoleUsed = await _userManager.GetUsersInRoleAsync(role.Name!);
        if (isRoleUsed.Count > 0)
        {
            throw new ApiException(
                "Vai trò đang được sử dụng, không thể xóa",
                HttpStatusCode.BadRequest
            );
        }

        await _roleManager.DeleteAsync(role);
    }

    public async Task<DetailRoleResponse> DetailRoleAsync(DetailRoleRequest detailRoleRequest)
    {
        var role =
            await _roleManager.FindByIdAsync(detailRoleRequest.RoleId.ToString())
            ?? throw new ApiException("Không tìm thấy vai trò", HttpStatusCode.BadRequest);
        return _mapper.Map<DetailRoleResponse>(role);
    }

    public async Task<List<ListRoleResponse>> ListRoleAsync(ListRoleRequest listRoleRequest)
    {
        var query = _roleManager.Roles.AsQueryable();

        if (!string.IsNullOrEmpty(listRoleRequest.RoleName))
        {
            query = query.Where(r => r.Name!.Contains(listRoleRequest.RoleName));
        }

        var roles = await query.ToListAsync();
        var response = new List<ListRoleResponse>();
        foreach (var role in roles)
        {
            var totalUsers = await _userManager.GetUsersInRoleAsync(role.Name!);
            response.Add(
                new ListRoleResponse
                {
                    RoleId = role.Id,
                    RoleName = role.Name!,
                    TotalUsers = totalUsers.Count,
                }
            );
        }

        return response;
    }

    public async Task UpdateRoleAsync(UpdateRoleRequest updateRoleRequest)
    {
        var role =
            await _roleManager.FindByIdAsync(updateRoleRequest.RoleId.ToString())
            ?? throw new ApiException("Không tìm thấy vai trò", HttpStatusCode.BadRequest);

        var existedRoleName = await _roleManager.FindByNameAsync(updateRoleRequest.RoleName);
        if (existedRoleName != null && existedRoleName.Id != updateRoleRequest.RoleId)
        {
            throw new ApiException("Tên vai trò đã tồn tại", HttpStatusCode.BadRequest);
        }

        _mapper.Map(updateRoleRequest, role);
        await _roleManager.UpdateAsync(role);
    }
}
