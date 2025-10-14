using ApiApplication.Dtos.Notification;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class NotificationMappingProfile : Profile
{
    public NotificationMappingProfile()
    {
        CreateMap<Notification, NotificationResponseDto>()
            .ForMember(d => d.UserIds, opt => opt.MapFrom(s => s.UserIds));

        CreateMap<NotificationSendRequestDto, Notification>()
            .ForMember(d => d.Id, opt => opt.Ignore());

        CreateMap<NotificationBulkSendRequestDto, Notification>()
            .ForMember(d => d.Id, opt => opt.Ignore());

        CreateMap<NotificationRoleSendRequestDto, Notification>()
            .ForMember(d => d.Id, opt => opt.Ignore());
    }
}
