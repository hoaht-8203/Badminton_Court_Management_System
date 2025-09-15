using System;
using ApiApplication.Enums;

namespace ApiApplication.Dtos;

public class RegisterRequest
{
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
}
