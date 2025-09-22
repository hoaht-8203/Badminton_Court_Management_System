using System;
using ApiApplication.Dtos;

namespace ApiApplication.Services;

public interface IUserService
{
    public Task<List<ListAdministratorResponse>> ListAdministratorAsync(
        ListAdministratorRequest listAdministratorRequest
    );

    public Task<DetailAdministratorResponse> DetailAdministratorAsync(
        DetailAdministratorRequest detailAdministratorRequest
    );

    public Task CreateAdministratorAsync(CreateAdministratorRequest createAdministratorRequest);

    public Task ChangeUserStatusAsync(ChangeUserStatusRequest changeUserStatusRequest);

    public Task UpdateUserAsync(UpdateUserRequest updateUserRequest);

    public Task UpdateUserRolesAsync(UpdateUserRolesRequest request);

    public Task<List<ListUserRoleItemResponse>> ListUserRolesAsync(ListUserRolesRequest request);
}
