using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ApiApplication.SignalR;

// Temporarily remove [Authorize] to test SignalR connection
// [Authorize]
public class BookingHub : Hub { }
