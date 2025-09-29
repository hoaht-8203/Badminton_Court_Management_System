using System;

namespace ApiApplication.Dtos.User;

public class DetailAdministratorRequest
{
    public required Guid UserId { get; set; }
}
