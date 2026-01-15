using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ApiApplication.Dtos.AuditLog;
using ApiApplication.Dtos.Pagination;

namespace ApiApplication.Services;

public interface IAuditLogService
{
    /// <summary>
    /// Get paginated audit logs with filters
    /// </summary>
    Task<PagedResponse<AuditLogDto>> GetAuditLogsAsync(AuditLogQueryDto query);

    /// <summary>
    /// Get audit log detail by ID
    /// </summary>
    Task<AuditLogDetailDto?> GetAuditLogDetailAsync(Guid id);

    /// <summary>
    /// Get all changes for a specific entity
    /// </summary>
    Task<List<AuditLogDto>> GetEntityHistoryAsync(string tableName, string entityId);

    /// <summary>
    /// Get all audit logs by user
    /// </summary>
    Task<PagedResponse<AuditLogDto>> GetByUserAsync(string userId, int page = 1, int pageSize = 10);

    /// <summary>
    /// Get all audit logs by table
    /// </summary>
    Task<PagedResponse<AuditLogDto>> GetByTableAsync(string tableName, int page = 1, int pageSize = 10);

    /// <summary>
    /// Get audit logs by action type
    /// </summary>
    Task<PagedResponse<AuditLogDto>> GetByActionAsync(string action, int page = 1, int pageSize = 10);

    /// <summary>
    /// Delete audit logs older than specified days
    /// </summary>
    Task<int> DeleteOldLogsAsync(int daysToKeep = 90);

    /// <summary>
    /// Create audit log entry
    /// </summary>
    Task CreateAuditLogAsync(Entities.AuditLog auditLog);
}
