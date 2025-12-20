using System.Net;
using System.Text;
using Microsoft.AspNetCore.Http;

namespace ApiApplication.Middlewares;

/// <summary>
/// Middleware to protect Swagger UI endpoints with Basic Authentication
/// </summary>
public class SwaggerBasicAuthMiddleware
{
    private readonly RequestDelegate _next;
    private const string ValidUsername = "admin";
    private const string ValidPassword = "admin123";

    public SwaggerBasicAuthMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

        // Check if the request is for Swagger or Scalar endpoints
        if (
            path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/scalar", StringComparison.OrdinalIgnoreCase)
        )
        {
            // Allow access to swagger.json without authentication (needed for Swagger UI to load)
            if (path.Contains("/swagger.json") || path.Contains("/swagger/v1/swagger.json"))
            {
                await _next(context);
                return;
            }

            // Allow static assets (CSS, JS, images) to be loaded without authentication
            var extension = Path.GetExtension(path).ToLowerInvariant();
            if (
                extension == ".css"
                || extension == ".js"
                || extension == ".png"
                || extension == ".jpg"
                || extension == ".jpeg"
                || extension == ".gif"
                || extension == ".svg"
                || extension == ".ico"
                || extension == ".woff"
                || extension == ".woff2"
                || extension == ".ttf"
                || extension == ".eot"
            )
            {
                await _next(context);
                return;
            }

            // Check Basic Authentication
            if (!IsAuthorized(context))
            {
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                context.Response.Headers["WWW-Authenticate"] =
                    "Basic realm=\"Swagger Documentation\"";
                await context.Response.WriteAsync("Unauthorized");
                return;
            }
        }

        await _next(context);
    }

    private bool IsAuthorized(HttpContext context)
    {
        string authHeader = context.Request.Headers["Authorization"].ToString();

        if (
            string.IsNullOrEmpty(authHeader)
            || !authHeader.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase)
        )
        {
            return false;
        }

        try
        {
            // Extract credentials from Authorization header
            var encodedCredentials = authHeader.Substring("Basic ".Length).Trim();
            var decodedCredentials = Encoding.UTF8.GetString(
                Convert.FromBase64String(encodedCredentials)
            );
            var credentials = decodedCredentials.Split(':', 2);

            if (credentials.Length != 2)
            {
                return false;
            }

            var username = credentials[0];
            var password = credentials[1];

            // Validate credentials
            return username == ValidUsername && password == ValidPassword;
        }
        catch
        {
            return false;
        }
    }
}
