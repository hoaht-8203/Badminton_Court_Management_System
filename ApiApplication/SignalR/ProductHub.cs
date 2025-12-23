using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ApiApplication.SignalR;

[Authorize]
public class ProductHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"SignalR: User {Context.User?.Identity?.Name} connected to ProductHub");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine(
            $"SignalR: User {Context.User?.Identity?.Name} disconnected from ProductHub. Exception: {exception?.Message}"
        );
        await base.OnDisconnectedAsync(exception);
    }
}

