using System;

namespace ApiApplication.Dtos;

public class CreateRoleRequest
{
    public required string RoleName { get; set; }
}
