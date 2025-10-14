using System;
using System.Collections.Generic;
using ApiApplication.Enums;

namespace ApiApplication.Dtos.Notification;

public class NotificationBulkSendRequestDto
{
    public IEnumerable<Guid> UserIds { get; set; } = Array.Empty<Guid>();
    public string Title { get; set; } = string.Empty;
    public string? Message { get; set; }
    public NotificationCategory NotificationByType { get; set; } = NotificationCategory.General;
    public NotificationType Type { get; set; } = NotificationType.Info;
}


