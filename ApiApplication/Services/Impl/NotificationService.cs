using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ApiApplication.Data;
using ApiApplication.Dtos.Notification;
using ApiApplication.Entities;
using ApiApplication.SignalR;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class NotificationService(
    ApplicationDbContext db,
    IMapper mapper,
    IHubContext<NotificationHub> hubContext,
    UserManager<ApplicationUser> userManager
) : INotificationService
{
    private readonly ApplicationDbContext _db = db;
    private readonly IMapper _mapper = mapper;
    private readonly IHubContext<NotificationHub> _hub = hubContext;
    private readonly UserManager<ApplicationUser> _userManager = userManager;

    public async Task<NotificationResponseDto> SendToUserAsync(NotificationSendRequestDto request)
    {
        var notification = _mapper.Map<Notification>(request);
        notification.Id = Guid.NewGuid();
        // DTO already provides strong-typed enums; no parsing required
        notification.UserIds = new[] { request.UserId };
        _db.Notifications.Add(notification);

        await _db.SaveChangesAsync();
        var dto = _mapper.Map<NotificationResponseDto>(notification);
        await _hub.Clients.User(request.UserId.ToString()).SendAsync("notification:received", dto);
        return dto;
    }

    public async Task<IReadOnlyList<NotificationResponseDto>> SendToManyUsersAsync(
        NotificationBulkSendRequestDto request
    )
    {
        var userIdArray =
            request.UserIds?.Where(id => id != Guid.Empty).Distinct().ToArray()
            ?? Array.Empty<Guid>();
        if (userIdArray.Length == 0)
        {
            return Array.Empty<NotificationResponseDto>();
        }

        // One Notification entity containing all recipients (fits current model)
        var notification = _mapper.Map<Notification>(request);
        notification.Id = Guid.NewGuid();
        // DTO already provides strong-typed enums; no parsing required
        notification.UserIds = userIdArray;
        _db.Notifications.Add(notification);

        await _db.SaveChangesAsync();

        var dto = _mapper.Map<NotificationResponseDto>(notification);
        foreach (var uid in userIdArray)
        {
            await _hub.Clients.User(uid.ToString()).SendAsync("notification:received", dto);
        }
        return new List<NotificationResponseDto> { dto };
    }

    public async Task<NotificationResponseDto> SendToRolesAsync(
        NotificationRoleSendRequestDto request
    )
    {
        var roles =
            request
                .Roles?.Where(r => !string.IsNullOrWhiteSpace(r))
                .Select(r => r.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray() ?? Array.Empty<string>();
        var recipientIds = new HashSet<Guid>();
        foreach (var role in roles)
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(role);
            foreach (var u in usersInRole)
            {
                recipientIds.Add(u.Id);
            }
        }

        var notification = _mapper.Map<Notification>(request);
        notification.Id = Guid.NewGuid();
        // DTO already provides strong-typed enums; no parsing required
        notification.UserIds = recipientIds.ToArray();
        _db.Notifications.Add(notification);

        await _db.SaveChangesAsync();

        var dto = _mapper.Map<NotificationResponseDto>(notification);
        foreach (var uid in recipientIds)
        {
            await _hub.Clients.User(uid.ToString()).SendAsync("notification:received", dto);
        }

        return dto;
    }

    public async Task<List<NotificationResponseDto>> ListAsync(ListNotificationRequestDto request)
    {
        var query = _db.Notifications.AsQueryable();

        if (request.UserId.HasValue)
        {
            query = query.Where(n => n.UserIds.Contains(request.UserId.Value));
        }

        var items = await query.OrderByDescending(n => n.CreatedAt).Take(200).ToListAsync();

        return items.Select(n => _mapper.Map<NotificationResponseDto>(n)).ToList();
    }
}
