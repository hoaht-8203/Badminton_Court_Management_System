using System;
using ApiApplication.Enums;

namespace ApiApplication.Dtos.Notification;

public class NotificationSendRequestDto
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Message { get; set; }
    public NotificationCategory NotificationByType { get; set; } = NotificationCategory.General;
    public NotificationType Type { get; set; } = NotificationType.Info;
}


