using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ApiApplication.Dtos.Notification;

namespace ApiApplication.Services;

public interface INotificationService
{
    Task<NotificationResponseDto> SendToUserAsync(NotificationSendRequestDto request);

    Task<IReadOnlyList<NotificationResponseDto>> SendToManyUsersAsync(
        NotificationBulkSendRequestDto request
    );

    Task<NotificationResponseDto> SendToRolesAsync(NotificationRoleSendRequestDto request);

    Task<List<NotificationResponseDto>> ListAsync(ListNotificationRequestDto request);
}
