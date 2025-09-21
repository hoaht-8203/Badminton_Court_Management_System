using System;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class AuthMappingProfile : Profile
{
    public AuthMappingProfile()
    {
        CreateMap<ApplicationUser, MyProfileResponse>();
        CreateMap<UpdateMyProfileRequest, ApplicationUser>();
    }
}
