using System;

namespace ApiApplication.Dtos;

public class ListUserRolesRequest
{
    public required Guid UserId { get; set; }
}
