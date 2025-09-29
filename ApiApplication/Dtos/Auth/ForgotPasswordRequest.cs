using System;

namespace ApiApplication.Dtos.Auth;

public class ForgotPasswordRequest
{
    public required string Email { get; set; }
}
