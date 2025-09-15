using System;

namespace ApiApplication.Dtos;

public class DetailAdministratorRequest
{
    public required Guid UserId { get; set; }
}
