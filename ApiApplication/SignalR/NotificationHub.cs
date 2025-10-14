using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ApiApplication.SignalR;

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        Console.WriteLine(
            $"SignalR: User {Context.User?.Identity?.Name} connected to NotificationHub"
        );
        // Join role groups for role-based broadcasting
        var roles =
            Context
                .User?.Claims.Where(c => c.Type == ClaimTypes.Role)
                .Select(c => c.Value)
                .Distinct()
                .ToArray() ?? Array.Empty<string>();
        foreach (var role in roles)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, role);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine(
            $"SignalR: User {Context.User?.Identity?.Name} disconnected from NotificationHub. Exception: {exception?.Message}"
        );
        await base.OnDisconnectedAsync(exception);
    }
}
