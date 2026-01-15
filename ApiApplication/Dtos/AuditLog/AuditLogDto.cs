using System;

namespace ApiApplication.Dtos.AuditLog;

public class AuditLogDto
{
    public Guid Id { get; set; }

    public string TableName { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty; // Create, Update, Delete

    public string EntityId { get; set; } = string.Empty;

    public string? OldValues { get; set; }

    public string? NewValues { get; set; }

    public string? ChangedColumns { get; set; }

    public string? UserId { get; set; }

    public string? UserName { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime Timestamp { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? CreatedBy { get; set; }

    public string? UpdatedBy { get; set; }
}
