using System;

namespace ApiApplication.Dtos;

public class DeleteRoleRequest
{
    public required Guid RoleId { get; set; }
}
