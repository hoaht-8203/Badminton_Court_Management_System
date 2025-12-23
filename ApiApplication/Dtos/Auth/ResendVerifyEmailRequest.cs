using System;

namespace ApiApplication.Dtos.Auth;

public class ResendVerifyEmailRequest
{
    public required string Email { get; set; }
}

