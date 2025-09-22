using System;

namespace ApiApplication.Dtos;

public class ForgotPasswordRequest
{
    public required string Email { get; set; }
}
