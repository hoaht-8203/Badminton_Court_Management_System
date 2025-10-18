using System;

namespace ApiApplication.Dtos.Notification;

public class NotificationResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Message { get; set; }
    public string? NotificationByType { get; set; }
    public string Type { get; set; } = "Info";
    public Guid[] UserIds { get; set; } = Array.Empty<Guid>();
    public DateTime CreatedAt { get; set; }
}
