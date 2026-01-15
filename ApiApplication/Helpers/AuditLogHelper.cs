using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using ApiApplication.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace ApiApplication.Helpers;

/// <summary>
/// Helper class to handle audit logging of entity changes
/// </summary>
public static class AuditLogHelper
{
    private static readonly HashSet<string> IgnoredEntities = new()
    {
        "AuditLog",
        "Activity",
        // Add other non-auditable entities here
    };

    private static readonly HashSet<string> AuditedEntities = new()
    {
        "Court",
        "BookingCourt",
        "Payment",
        "Staff",
        "ApplicationUser",
        "Membership",
        "Order",
        "Product",
        "CourtPricingRules",
        "Receipt",
        "ReturnGoods",
        "Service",
        "Payroll",
        "Supplier",
        "SupplierBankAccount",
        "StoreBankAccount",
        // Add other auditable entities here
    };

    /// <summary>
    /// Check if an entity type should be audited
    /// </summary>
    public static bool ShouldAudit(EntityEntry entry)
    {
        var entityTypeName = entry.Entity.GetType().Name;

        // If entity is in ignored list, don't audit
        if (IgnoredEntities.Contains(entityTypeName))
            return false;

        // If whitelist is being used, only audit if in whitelist
        return AuditedEntities.Contains(entityTypeName);
    }

    /// <summary>
    /// Create audit log entries for entity changes
    /// </summary>
    public static List<AuditLog> CreateAuditLogs(
        EntityEntry entry,
        string? userId,
        string? userName,
        string? ipAddress,
        string? userAgent)
    {
        var auditLogs = new List<AuditLog>();

        if (!ShouldAudit(entry))
            return auditLogs;

        var entityType = entry.Entity.GetType();
        var tableName = entityType.Name;
        var entityId = GetEntityId(entry);

        if (string.IsNullOrWhiteSpace(entityId))
            return auditLogs;

        switch (entry.State)
        {
            case EntityState.Added:
                auditLogs.Add(CreateAuditLog(
                    tableName,
                    "Create",
                    entityId,
                    null,
                    GetNewValues(entry),
                    GetChangedColumnNames(entry),
                    userId,
                    userName,
                    ipAddress,
                    userAgent
                ));
                break;

            case EntityState.Modified:
                var oldValues = GetOldValues(entry);
                var newValues = GetNewValues(entry);

                // Only log if values actually changed
                if (oldValues != newValues)
                {
                    auditLogs.Add(CreateAuditLog(
                        tableName,
                        "Update",
                        entityId,
                        oldValues,
                        newValues,
                        GetChangedColumnNames(entry),
                        userId,
                        userName,
                        ipAddress,
                        userAgent
                    ));
                }
                break;

            case EntityState.Deleted:
                auditLogs.Add(CreateAuditLog(
                    tableName,
                    "Delete",
                    entityId,
                    GetDeletedValues(entry),
                    null,
                    GetChangedColumnNames(entry),
                    userId,
                    userName,
                    ipAddress,
                    userAgent
                ));
                break;
        }

        return auditLogs;
    }

    /// <summary>
    /// Create a single audit log entry
    /// </summary>
    private static AuditLog CreateAuditLog(
        string tableName,
        string action,
        string entityId,
        string? oldValues,
        string? newValues,
        string? changedColumns,
        string? userId,
        string? userName,
        string? ipAddress,
        string? userAgent)
    {
        return new AuditLog
        {
            Id = Guid.NewGuid(),
            TableName = tableName,
            Action = action,
            EntityId = entityId,
            OldValues = oldValues,
            NewValues = newValues,
            ChangedColumns = changedColumns,
            UserId = userId,
            UserName = userName,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Timestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };
    }

    /// <summary>
    /// Get primary key value of the entity
    /// </summary>
    private static string GetEntityId(EntityEntry entry)
    {
        var keyProperties = entry.Metadata.FindPrimaryKey()?.Properties;
        if (keyProperties == null || !keyProperties.Any())
            return string.Empty;

        var keyValues = keyProperties
            .Select(p =>
            {
                // For Added entities, use CurrentValues
                // For Modified/Deleted, use CurrentValues or OriginalValues
                var value = entry.State == EntityState.Deleted
                    ? entry.OriginalValues[p]
                    : entry.CurrentValues[p];
                return value;
            })
            .Where(v => v != null)
            .ToList();

        if (keyValues.Count == 0)
            return string.Empty;

        return keyValues.Count == 1
            ? keyValues[0]?.ToString() ?? string.Empty
            : string.Join(",", keyValues);
    }

    /// <summary>
    /// Get old values as JSON string
    /// </summary>
    private static string? GetOldValues(EntityEntry entry)
    {
        var oldValues = new Dictionary<string, object?>();

        foreach (var property in entry.Properties)
        {
            if (property.Metadata.IsKey() || property.Metadata.IsForeignKey())
                continue;

            var originalValue = property.OriginalValue;
            if (originalValue != null)
            {
                oldValues[property.Metadata.Name] = originalValue;
            }
        }

        return oldValues.Count > 0 ? JsonSerializer.Serialize(oldValues) : null;
    }

    /// <summary>
    /// Get new values as JSON string
    /// </summary>
    private static string? GetNewValues(EntityEntry entry)
    {
        var newValues = new Dictionary<string, object?>();

        foreach (var property in entry.Properties)
        {
            if (property.Metadata.IsKey() || property.Metadata.IsForeignKey())
                continue;

            var currentValue = property.CurrentValue;
            newValues[property.Metadata.Name] = currentValue;
        }

        return newValues.Count > 0 ? JsonSerializer.Serialize(newValues) : null;
    }

    /// <summary>
    /// Get values for deleted entity
    /// </summary>
    private static string? GetDeletedValues(EntityEntry entry)
    {
        var deletedValues = new Dictionary<string, object?>();

        foreach (var property in entry.Properties)
        {
            if (property.Metadata.IsKey())
            {
                deletedValues[property.Metadata.Name] = property.OriginalValue;
            }
            else if (!property.Metadata.IsForeignKey())
            {
                var originalValue = property.OriginalValue;
                if (originalValue != null)
                {
                    deletedValues[property.Metadata.Name] = originalValue;
                }
            }
        }

        return deletedValues.Count > 0 ? JsonSerializer.Serialize(deletedValues) : null;
    }

    /// <summary>
    /// Get comma-separated list of changed column names
    /// </summary>
    private static string? GetChangedColumnNames(EntityEntry entry)
    {
        var changedColumns = new List<string>();

        foreach (var property in entry.Properties)
        {
            if (property.IsModified)
            {
                changedColumns.Add(property.Metadata.Name);
            }
        }

        return changedColumns.Count > 0 ? string.Join(",", changedColumns) : null;
    }
}
