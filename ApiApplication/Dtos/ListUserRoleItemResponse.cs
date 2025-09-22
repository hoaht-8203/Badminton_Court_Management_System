using System;

namespace ApiApplication.Dtos;

public class ListUserRoleItemResponse
{
    public required Guid RoleId { get; set; }
    public required string RoleName { get; set; }
    public required bool Assigned { get; set; }
}
