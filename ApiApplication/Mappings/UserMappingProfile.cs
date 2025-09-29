using System;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Auth;
using ApiApplication.Dtos.User;
using ApiApplication.Entities;
using AutoMapper;
using Microsoft.AspNetCore.Identity;

namespace ApiApplication.Mappings;

public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
        CreateMap<DateTime?, DateOnly?>()
            .ConvertUsing(src => src.HasValue ? DateOnly.FromDateTime(src.Value) : null);
        CreateMap<DateOnly?, DateTime?>()
            .ConvertUsing(src => src.HasValue ? src.Value.ToDateTime(TimeOnly.MinValue) : null);

        CreateMap<RegisterRequest, ApplicationUser>();
        CreateMap<ApplicationUser, CurrentUserResponse>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.Id));
        CreateMap<CreateAdministratorRequest, ApplicationUser>();
        CreateMap<UpdateUserRequest, ApplicationUser>();
        CreateMap<ApplicationUser, ListAdministratorResponse>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.Id));
        CreateMap<ApplicationUser, DetailAdministratorResponse>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.Id));
    }
}
