using System;
using System.Collections.Generic;
using ApiApplication.Enums;

namespace ApiApplication.Dtos.Notification;

public class NotificationRoleSendRequestDto
{
    public IEnumerable<string> Roles { get; set; } = Array.Empty<string>(); // e.g. "Staff","LeTan","ChuSan"
    public string Title { get; set; } = string.Empty;
    public string? Message { get; set; }
    public NotificationCategory NotificationByType { get; set; } = NotificationCategory.General;
    public NotificationType Type { get; set; } = NotificationType.Info;
}
