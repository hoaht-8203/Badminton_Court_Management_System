using System;
using System.Threading.Tasks;
using ApiApplication.Dtos.AuditLog;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace ApiApplication.SignalR;

/// <summary>
/// SignalR Hub for real-time audit log updates
/// Only Admin users can connect and receive audit log notifications
/// </summary>
[Authorize(Roles = "Admin")]
public class AuditLogHub : Hub
{
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AuditLogHub> _logger;

    public AuditLogHub(IAuditLogService auditLogService, ILogger<AuditLogHub> logger)
    {
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Admin connected to AuditLog hub - ConnectionId: {ConnectionId}, User: {User}",
            Context.ConnectionId, Context.User?.Identity?.Name);

        // Send welcome message
        await Clients.Caller.SendAsync("ReceiveMessage", 
            new { type = "connected", message = "Connected to audit log stream" });

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Admin disconnected from AuditLog hub - ConnectionId: {ConnectionId}",
            Context.ConnectionId);

        if (exception != null)
        {
            _logger.LogError(exception, "Error in AuditLog hub connection");
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Subscribe to real-time audit logs with optional filter
    /// </summary>
    public async Task SubscribeToAuditLogs(
        string? tableName = null,
        string? action = null)
    {
        _logger.LogInformation("Admin subscribed to audit logs - TableName: {TableName}, Action: {Action}",
            tableName, action);

        var filterKey = GenerateFilterKey(tableName, action);
        await Groups.AddToGroupAsync(Context.ConnectionId, filterKey);

        await Clients.Caller.SendAsync("ReceiveMessage",
            new 
            { 
                type = "subscribed",
                message = $"Subscribed to audit logs - Table: {tableName ?? "All"}, Action: {action ?? "All"}",
                filter = new { tableName, action }
            });
    }

    /// <summary>
    /// Unsubscribe from audit logs
    /// </summary>
    public async Task UnsubscribeFromAuditLogs(
        string? tableName = null,
        string? action = null)
    {
        var filterKey = GenerateFilterKey(tableName, action);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, filterKey);

        await Clients.Caller.SendAsync("ReceiveMessage",
            new { type = "unsubscribed", message = "Unsubscribed from audit logs" });
    }

    /// <summary>
    /// Get recent audit logs (last 50)
    /// </summary>
    public async Task GetRecentAuditLogs()
    {
        try
        {
            var query = new Dtos.AuditLog.AuditLogQueryDto
            {
                Page = 1,
                PageSize = 50
            };

            var result = await _auditLogService.GetAuditLogsAsync(query);

            await Clients.Caller.SendAsync("ReceiveRecentLogs", result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent audit logs");
            await Clients.Caller.SendAsync("ReceiveError", 
                new { message = "Error retrieving recent audit logs" });
        }
    }

    /// <summary>
    /// Get audit log detail
    /// </summary>
    public async Task GetAuditLogDetail(Guid id)
    {
        try
        {
            var result = await _auditLogService.GetAuditLogDetailAsync(id);
            await Clients.Caller.SendAsync("ReceiveAuditLogDetail", result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit log detail");
            await Clients.Caller.SendAsync("ReceiveError", 
                new { message = "Error retrieving audit log detail" });
        }
    }

    /// <summary>
    /// Generate group key for filtering
    /// </summary>
    private string GenerateFilterKey(string? tableName, string? action)
    {
        return $"auditlog_{tableName ?? "all"}_{action ?? "all"}".ToLower();
    }

    /// <summary>
    /// Internal method to broadcast new audit log (called from service)
    /// </summary>
    public async Task BroadcastNewAuditLog(AuditLogDto auditLog)
    {
        _logger.LogDebug("Broadcasting new audit log - Table: {TableName}, Action: {Action}",
            auditLog.TableName, auditLog.Action);

        // Broadcast to specific filters
        var filterKey = GenerateFilterKey(auditLog.TableName, auditLog.Action);
        await Clients.Group(filterKey).SendAsync("ReceiveNewAuditLog", auditLog);

        // Also broadcast to "All" group
        await Clients.Group(GenerateFilterKey(null, null)).SendAsync("ReceiveNewAuditLog", auditLog);

        // Broadcast to all connected admins
        await Clients.All.SendAsync("ReceiveNewAuditLogBroadcast", auditLog);
    }
}
