using System;

namespace ApiApplication.Dtos;

public class DetailRoleResponse
{
    public required Guid RoleId { get; set; }
    public required string RoleName { get; set; }
}
