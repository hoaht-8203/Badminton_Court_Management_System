using System;

namespace ApiApplication.Template;

public class SendNewPasswordEmailAsyncRequest
{
    public required string To { get; set; }
    public required string ToName { get; set; }
    public required string FullName { get; set; }
    public required string NewPassword { get; set; }
}
