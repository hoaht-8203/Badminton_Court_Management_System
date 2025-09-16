using System;
using System.Security.Claims;

namespace ApiApplication.Sessions.Impl;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    public string? Username => _httpContextAccessor.HttpContext?.User?.Identity?.Name;

    public Guid? UserId
    {
        get
        {
            var userId = _httpContextAccessor
                .HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;
            return userId != null ? Guid.Parse(userId) : null;
        }
    }
}
