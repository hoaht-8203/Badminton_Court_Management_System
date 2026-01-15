using System;
using System.Threading.Tasks;
using ApiApplication.Dtos.AuditLog;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AuditLogsController> _logger;

    public AuditLogsController(IAuditLogService auditLogService, ILogger<AuditLogsController> logger)
    {
        _auditLogService = auditLogService;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated audit logs with filters
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(AuditLogResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] AuditLogQueryDto query)
    {
        try
        {
            _logger.LogInformation("Getting audit logs with filter - Table: {TableName}, Action: {Action}, User: {UserId}",
                query.TableName, query.Action, query.UserId);

            var result = await _auditLogService.GetAuditLogsAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit logs");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "Error retrieving audit logs" });
        }
    }

    /// <summary>
    /// Get audit log detail by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AuditLogDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAuditLogDetail(Guid id)
    {
        try
        {
            var result = await _auditLogService.GetAuditLogDetailAsync(id);

            if (result == null)
            {
                return NotFound(new { message = "Audit log not found" });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit log detail for id: {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "Error retrieving audit log detail" });
        }
    }

    /// <summary>
    /// Get change history for a specific entity
    /// </summary>
    [HttpGet("entity-history")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEntityHistory(
        [FromQuery] string tableName,
        [FromQuery] string entityId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(tableName) || string.IsNullOrWhiteSpace(entityId))
            {
                return BadRequest(new { message = "TableName and EntityId are required" });
            }

            _logger.LogInformation("Getting entity history - Table: {TableName}, EntityId: {EntityId}", 
                tableName, entityId);

            var result = await _auditLogService.GetEntityHistoryAsync(tableName, entityId);
            return Ok(new { tableName, entityId, history = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting entity history");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "Error retrieving entity history" });
        }
    }

    /// <summary>
    /// Get audit logs by user
    /// </summary>
    [HttpGet("by-user/{userId}")]
    [ProducesResponseType(typeof(AuditLogResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByUser(
        string userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            _logger.LogInformation("Getting audit logs for user: {UserId}", userId);
            var result = await _auditLogService.GetByUserAsync(userId, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit logs for user: {UserId}", userId);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "Error retrieving user audit logs" });
        }
    }

    /// <summary>
    /// Get audit logs by table name
    /// </summary>
    [HttpGet("by-table/{tableName}")]
    [ProducesResponseType(typeof(AuditLogResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByTable(
        string tableName,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            _logger.LogInformation("Getting audit logs for table: {TableName}", tableName);
            var result = await _auditLogService.GetByTableAsync(tableName, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit logs for table: {TableName}", tableName);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "Error retrieving table audit logs" });
        }
    }

    /// <summary>
    /// Get audit logs by action type (Create, Update, Delete)
    /// </summary>
    [HttpGet("by-action/{action}")]
    [ProducesResponseType(typeof(AuditLogResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByAction(
        string action,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var validActions = new[] { "Create", "Update", "Delete" };
            if (!validActions.Contains(action))
            {
                return BadRequest(new { message = "Action must be Create, Update, or Delete" });
            }

            _logger.LogInformation("Getting audit logs for action: {Action}", action);
            var result = await _auditLogService.GetByActionAsync(action, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit logs for action: {Action}", action);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "Error retrieving action audit logs" });
        }
    }

    /// <summary>
    /// Delete audit logs older than specified days (Admin only)
    /// </summary>
    [HttpDelete("cleanup")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteOldLogs([FromQuery] int daysToKeep = 90)
    {
        try
        {
            if (daysToKeep < 1 || daysToKeep > 365)
            {
                return BadRequest(new { message = "daysToKeep must be between 1 and 365" });
            }

            _logger.LogWarning("Admin is deleting audit logs older than {DaysToKeep} days", daysToKeep);
            var deletedCount = await _auditLogService.DeleteOldLogsAsync(daysToKeep);
            
            return Ok(new { 
                message = $"Deleted {deletedCount} audit log entries older than {daysToKeep} days",
                deletedCount 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting old audit logs");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "Error deleting audit logs" });
        }
    }

    /// <summary>
    /// Export audit logs (CSV format)
    /// </summary>
    [HttpGet("export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportAuditLogs(
        [FromQuery] string? tableName = null,
        [FromQuery] string? action = null,
        [FromQuery] string? userId = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null)
    {
        try
        {
            _logger.LogInformation("Exporting audit logs - Table: {TableName}, Action: {Action}", 
                tableName, action);

            var query = new AuditLogQueryDto
            {
                TableName = tableName,
                Action = action,
                UserId = userId,
                DateFrom = dateFrom,
                DateTo = dateTo,
                Page = 1,
                PageSize = 10000 // Export all matching records
            };

            var result = await _auditLogService.GetAuditLogsAsync(query);

            // Build CSV content
            var csv = new System.Text.StringBuilder();
            csv.AppendLine("Id,TableName,Action,EntityId,ChangedColumns,UserId,UserName,IpAddress,Timestamp");

            foreach (var log in result.Items)
            {
                csv.AppendLine(
                    $"\"{log.Id}\",\"{log.TableName}\",\"{log.Action}\",\"{log.EntityId}\"," +
                    $"\"{log.ChangedColumns}\",\"{log.UserId}\",\"{log.UserName}\",\"{log.IpAddress}\",\"{log.Timestamp:O}\""
                );
            }

            var fileName = $"audit-logs-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv";
            return File(
                System.Text.Encoding.UTF8.GetBytes(csv.ToString()),
                "text/csv",
                fileName
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting audit logs");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "Error exporting audit logs" });
        }
    }
}
