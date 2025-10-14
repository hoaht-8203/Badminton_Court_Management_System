using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ApiApplication.Entities.Shared;
using ApiApplication.Enums;

namespace ApiApplication.Entities;

public class Notification : BaseEntity, IAuditableEntity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Title { get; set; } = string.Empty;
    public string? Message { get; set; }
    public NotificationCategory NotificationByType { get; set; } = NotificationCategory.General;
    public NotificationType Type { get; set; } = NotificationType.Info;
    public required Guid[] UserIds { get; set; } = Array.Empty<Guid>();
}

