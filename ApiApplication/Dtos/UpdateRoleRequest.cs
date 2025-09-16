using System;

namespace ApiApplication.Dtos;

public class UpdateRoleRequest
{
    public required Guid RoleId { get; set; }
    public required string RoleName { get; set; }
}
