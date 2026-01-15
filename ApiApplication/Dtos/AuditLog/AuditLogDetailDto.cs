using System;

namespace ApiApplication.Dtos.AuditLog;

/// <summary>
/// Detailed DTO for viewing complete change history of an entity
/// </summary>
public class AuditLogDetailDto
{
    public Guid Id { get; set; }

    public string TableName { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty;

    public string EntityId { get; set; } = string.Empty;

    public string? ChangedColumns { get; set; }

    public object? OldValuesObject { get; set; } // Parsed from JSON

    public object? NewValuesObject { get; set; } // Parsed from JSON

    public string? UserId { get; set; }

    public string? UserName { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime Timestamp { get; set; }
}
