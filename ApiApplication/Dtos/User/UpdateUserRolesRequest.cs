using System;

namespace ApiApplication.Dtos.User;

public class UpdateUserRolesRequest
{
    public required Guid UserId { get; set; }
    public required List<string> Roles { get; set; } = [];
}
