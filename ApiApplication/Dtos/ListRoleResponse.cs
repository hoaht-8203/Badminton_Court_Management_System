using System;

namespace ApiApplication.Dtos;

public class ListRoleResponse
{
    public required Guid RoleId { get; set; }
    public required string RoleName { get; set; }
    public required int TotalUsers { get; set; }
}
