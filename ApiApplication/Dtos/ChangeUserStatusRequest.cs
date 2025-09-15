using System;

namespace ApiApplication.Dtos;

public class ChangeUserStatusRequest
{
    public required Guid UserId { get; set; }
    public required string Status { get; set; }
}
