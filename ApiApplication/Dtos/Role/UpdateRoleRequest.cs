using System;

namespace ApiApplication.Dtos.Role;

public class UpdateRoleRequest
{
    public required Guid RoleId { get; set; }
    public required string RoleName { get; set; }
}
