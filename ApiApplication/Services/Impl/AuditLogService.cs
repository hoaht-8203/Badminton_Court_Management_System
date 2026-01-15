using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using ApiApplication.Data;
using ApiApplication.Dtos.AuditLog;
using ApiApplication.Dtos.Pagination;
using ApiApplication.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ApiApplication.Services.Impl;

public class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(ApplicationDbContext context, ILogger<AuditLogService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResponse<AuditLogDto>> GetAuditLogsAsync(AuditLogQueryDto query)
    {
        try
        {
            var auditLogsQuery = _context.AuditLogs.AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(query.TableName))
            {
                auditLogsQuery = auditLogsQuery.Where(x => x.TableName == query.TableName);
            }

            if (!string.IsNullOrWhiteSpace(query.Action))
            {
                auditLogsQuery = auditLogsQuery.Where(x => x.Action == query.Action);
            }

            if (!string.IsNullOrWhiteSpace(query.UserId))
            {
                auditLogsQuery = auditLogsQuery.Where(x => x.UserId == query.UserId);
            }

            if (!string.IsNullOrWhiteSpace(query.EntityId))
            {
                auditLogsQuery = auditLogsQuery.Where(x => x.EntityId == query.EntityId);
            }

            if (query.DateFrom.HasValue)
            {
                auditLogsQuery = auditLogsQuery.Where(x => x.Timestamp >= query.DateFrom.Value);
            }

            if (query.DateTo.HasValue)
            {
                var endOfDay = query.DateTo.Value.AddDays(1).AddTicks(-1);
                auditLogsQuery = auditLogsQuery.Where(x => x.Timestamp <= endOfDay);
            }

            if (!string.IsNullOrWhiteSpace(query.SearchKeyword))
            {
                var keyword = query.SearchKeyword.ToLower();
                auditLogsQuery = auditLogsQuery.Where(x =>
                    x.UserName!.ToLower().Contains(keyword) ||
                    x.IpAddress!.ToLower().Contains(keyword) ||
                    x.TableName.ToLower().Contains(keyword) ||
                    x.EntityId.ToLower().Contains(keyword)
                );
            }

            // Get total count before pagination
            var totalItems = await auditLogsQuery.CountAsync();

            // Apply pagination
            var items = await auditLogsQuery
                .OrderByDescending(x => x.Timestamp)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();
            
            var mappedItems = items.Select(x => MapToDto(x)).ToList();

            var totalPages = (int)Math.Ceiling((double)totalItems / query.PageSize);

            return new PagedResponse<AuditLogDto>
            {
                Items = mappedItems,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalItems = totalItems,
                TotalPages = totalPages
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit logs");
            throw;
        }
    }

    public async Task<AuditLogDetailDto?> GetAuditLogDetailAsync(Guid id)
    {
        try
        {
            var auditLog = await _context.AuditLogs.FirstOrDefaultAsync(x => x.Id == id);

            if (auditLog == null)
                return null;

            return MapToDetailDto(auditLog);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit log detail for id: {Id}", id);
            throw;
        }
    }

    public async Task<List<AuditLogDto>> GetEntityHistoryAsync(string tableName, string entityId)
    {
        try
        {
            var logs = await _context.AuditLogs
                .Where(x => x.TableName == tableName && x.EntityId == entityId)
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();

            return logs.Select(x => MapToDto(x)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting entity history for table: {TableName}, entityId: {EntityId}", tableName, entityId);
            throw;
        }
    }

    public async Task<PagedResponse<AuditLogDto>> GetByUserAsync(string userId, int page = 1, int pageSize = 10)
    {
        try
        {
            var query = new AuditLogQueryDto
            {
                UserId = userId,
                Page = page,
                PageSize = pageSize
            };

            return await GetAuditLogsAsync(query);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit logs for user: {UserId}", userId);
            throw;
        }
    }

    public async Task<PagedResponse<AuditLogDto>> GetByTableAsync(string tableName, int page = 1, int pageSize = 10)
    {
        try
        {
            var query = new AuditLogQueryDto
            {
                TableName = tableName,
                Page = page,
                PageSize = pageSize
            };

            return await GetAuditLogsAsync(query);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit logs for table: {TableName}", tableName);
            throw;
        }
    }

    public async Task<PagedResponse<AuditLogDto>> GetByActionAsync(string action, int page = 1, int pageSize = 10)
    {
        try
        {
            var query = new AuditLogQueryDto
            {
                Action = action,
                Page = page,
                PageSize = pageSize
            };

            return await GetAuditLogsAsync(query);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit logs for action: {Action}", action);
            throw;
        }
    }

    public async Task<int> DeleteOldLogsAsync(int daysToKeep = 90)
    {
        try
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);

            var logsToDelete = await _context.AuditLogs
                .Where(x => x.CreatedAt < cutoffDate)
                .ToListAsync();

            if (logsToDelete.Count > 0)
            {
                _context.AuditLogs.RemoveRange(logsToDelete);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Deleted {Count} old audit logs (before {CutoffDate})", logsToDelete.Count, cutoffDate);
            }

            return logsToDelete.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting old audit logs");
            throw;
        }
    }

    public async Task CreateAuditLogAsync(AuditLog auditLog)
    {
        try
        {
            auditLog.Id = Guid.NewGuid();
            auditLog.CreatedAt = DateTime.UtcNow;
            auditLog.Timestamp = DateTime.UtcNow;

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Audit log created: Table={TableName}, Action={Action}, EntityId={EntityId}, UserId={UserId}",
                auditLog.TableName,
                auditLog.Action,
                auditLog.EntityId,
                auditLog.UserId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating audit log");
            throw;
        }
    }

    /// <summary>
    /// Map AuditLog entity to DTO
    /// </summary>
    private static AuditLogDto MapToDto(AuditLog auditLog)
    {
        return new AuditLogDto
        {
            Id = auditLog.Id,
            TableName = auditLog.TableName,
            Action = auditLog.Action,
            EntityId = auditLog.EntityId,
            OldValues = auditLog.OldValues,
            NewValues = auditLog.NewValues,
            ChangedColumns = auditLog.ChangedColumns,
            UserId = auditLog.UserId,
            UserName = auditLog.UserName,
            IpAddress = auditLog.IpAddress,
            UserAgent = auditLog.UserAgent,
            Timestamp = auditLog.Timestamp,
            CreatedAt = auditLog.CreatedAt,
            UpdatedAt = auditLog.UpdatedAt,
            CreatedBy = auditLog.CreatedBy,
            UpdatedBy = auditLog.UpdatedBy
        };
    }

    /// <summary>
    /// Map AuditLog entity to detail DTO with parsed JSON
    /// </summary>
    private AuditLogDetailDto MapToDetailDto(AuditLog auditLog)
    {
        object? oldValuesObject = null;
        object? newValuesObject = null;

        try
        {
            if (!string.IsNullOrWhiteSpace(auditLog.OldValues))
            {
                oldValuesObject = JsonSerializer.Deserialize<object>(auditLog.OldValues);
            }

            if (!string.IsNullOrWhiteSpace(auditLog.NewValues))
            {
                newValuesObject = JsonSerializer.Deserialize<object>(auditLog.NewValues);
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Error deserializing audit log values for id: {Id}", auditLog.Id);
        }

        return new AuditLogDetailDto
        {
            Id = auditLog.Id,
            TableName = auditLog.TableName,
            Action = auditLog.Action,
            EntityId = auditLog.EntityId,
            ChangedColumns = auditLog.ChangedColumns,
            OldValuesObject = oldValuesObject,
            NewValuesObject = newValuesObject,
            UserId = auditLog.UserId,
            UserName = auditLog.UserName,
            IpAddress = auditLog.IpAddress,
            UserAgent = auditLog.UserAgent,
            Timestamp = auditLog.Timestamp
        };
    }
}
