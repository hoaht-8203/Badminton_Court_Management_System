using System;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using AutoMapper;
using Microsoft.AspNetCore.Identity;

namespace ApiApplication.Mappings;

public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
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
