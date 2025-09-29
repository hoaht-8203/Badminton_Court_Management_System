using System;

namespace ApiApplication.Dtos.User;

public class ChangeUserStatusRequest
{
    public required Guid UserId { get; set; }
    public required string Status { get; set; }
}
