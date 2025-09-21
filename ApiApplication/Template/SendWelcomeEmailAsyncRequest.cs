using System;

namespace ApiApplication.Template;

public class SendWelcomeEmailAsyncRequest
{
    public required string To { get; set; }
    public required string ToName { get; set; }
    public required string FullName { get; set; }
    public required string UserName { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
}
