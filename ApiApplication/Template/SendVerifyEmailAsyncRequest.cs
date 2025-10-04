using System;

namespace ApiApplication.Template;

public class SendVerifyEmailAsyncRequest
{
    public required string To { get; set; }
    public required string ToName { get; set; }
    public required string FullName { get; set; }
    public required string Token { get; set; }
    public required string ExpiresAt { get; set; }
}
