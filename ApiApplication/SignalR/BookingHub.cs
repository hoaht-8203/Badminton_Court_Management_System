using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ApiApplication.SignalR;

[Authorize]
public class BookingHub : Hub 
{
    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"SignalR: User {Context.User?.Identity?.Name} connected");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"SignalR: User {Context.User?.Identity?.Name} disconnected. Exception: {exception?.Message}");
        await base.OnDisconnectedAsync(exception);
    }
}
