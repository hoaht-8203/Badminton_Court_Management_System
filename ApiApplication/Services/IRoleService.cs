using ApiApplication.Dtos.Role;

namespace ApiApplication.Services;

public interface IRoleService
{
    Task<List<ListRoleResponse>> ListRoleAsync(ListRoleRequest listRoleRequest);

    Task<DetailRoleResponse> DetailRoleAsync(DetailRoleRequest detailRoleRequest);

    Task CreateRoleAsync(CreateRoleRequest createRoleRequest);

    Task UpdateRoleAsync(UpdateRoleRequest updateRoleRequest);

    Task DeleteRoleAsync(DeleteRoleRequest deleteRoleRequest);
}
