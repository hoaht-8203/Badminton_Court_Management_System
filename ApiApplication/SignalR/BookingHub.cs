using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ApiApplication.SignalR;

[Authorize]
public class BookingHub : Hub { }
