using System;

namespace ApiApplication.Options;

public class EmailOptions
{
    public const string EmailOptionsKey = "EmailOptions";

    public string SmtpServer { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public int Timeout { get; set; } = 30000; // 30 seconds
    public bool UseDefaultCredentials { get; set; } = false;
    public string? PickupDirectoryLocation { get; set; } // For file-based email testing
    public bool RequireAuthentication { get; set; } = true;
    public string? ClientCertificatePath { get; set; } // For client certificate authentication
}
