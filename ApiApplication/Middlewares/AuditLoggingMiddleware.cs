using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ApiApplication.Middlewares;

/// <summary>
/// Middleware to capture HTTP request context information for audit logging
/// </summary>
public class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditLoggingMiddleware> _logger;

    public AuditLoggingMiddleware(RequestDelegate next, ILogger<AuditLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // Get client IP address
            var ipAddress = GetClientIpAddress(context);

            // Get user agent
            var userAgent = context.Request.Headers.UserAgent.ToString();

            // Get user ID from claims
            var userId = context.User?.FindFirst("sub")?.Value 
                ?? context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;

            // Get user name from claims
            var userName = context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value
                ?? context.User?.FindFirst("email")?.Value
                ?? context.User?.Identity?.Name;

            // Store audit context in HttpContext.Items for later use in services
            context.Items["AuditLog_IpAddress"] = ipAddress;
            context.Items["AuditLog_UserAgent"] = userAgent;
            context.Items["AuditLog_UserId"] = userId;
            context.Items["AuditLog_UserName"] = userName;

            _logger.LogDebug(
                "Audit context set - IP: {IpAddress}, User: {UserName}, UserId: {UserId}",
                ipAddress,
                userName,
                userId
            );
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error setting audit logging context");
            // Don't throw, continue normally
        }

        await _next(context);
    }

    /// <summary>
    /// Get client IP address from HttpContext
    /// </summary>
    private string GetClientIpAddress(HttpContext context)
    {
        // Check X-Forwarded-For header first (for proxies/load balancers)
        if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
        {
            var ips = forwardedFor.ToString().Split(',');
            if (ips.Length > 0 && !string.IsNullOrWhiteSpace(ips[0]))
            {
                return ips[0].Trim();
            }
        }

        // Check X-Real-IP header
        if (context.Request.Headers.TryGetValue("X-Real-IP", out var realIp))
        {
            if (!string.IsNullOrWhiteSpace(realIp))
            {
                return realIp.ToString();
            }
        }

        // Fall back to RemoteIpAddress
        return context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
    }
}
