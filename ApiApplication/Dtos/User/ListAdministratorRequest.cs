using System;

namespace ApiApplication.Dtos.User;

public class ListAdministratorRequest
{
    public string? Keyword { get; set; }
    public string? Role { get; set; }
    public string? Status { get; set; }
}
