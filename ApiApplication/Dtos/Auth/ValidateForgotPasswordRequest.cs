using System;

namespace ApiApplication.Dtos.Auth;

public class ValidateForgotPasswordRequest
{
    public required string Email { get; set; }
    public required string Token { get; set; }
}
