using System;

namespace ApiApplication.Dtos.Role;

public class DeleteRoleRequest
{
    public required Guid RoleId { get; set; }
}
