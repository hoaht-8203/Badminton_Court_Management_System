using System;

namespace ApiApplication.Dtos;

public class UpdatePasswordRequest
{
    public required string OldPassword { get; set; }
    public required string NewPassword { get; set; }
}
