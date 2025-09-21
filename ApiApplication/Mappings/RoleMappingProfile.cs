using System;
using ApiApplication.Dtos;
using AutoMapper;
using Microsoft.AspNetCore.Identity;

namespace ApiApplication.Mappings;

public class RoleMappingProfile : Profile
{
    public RoleMappingProfile()
    {
        CreateMap<CreateRoleRequest, IdentityRole<Guid>>()
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.RoleName));
        CreateMap<UpdateRoleRequest, IdentityRole<Guid>>()
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.RoleName));
        CreateMap<IdentityRole<Guid>, DetailRoleResponse>()
            .ForMember(dest => dest.RoleId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Name));
        CreateMap<IdentityRole<Guid>, ListRoleResponse>()
            .ForMember(dest => dest.RoleId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Name));
        CreateMap<IdentityRole<Guid>, UpdateRoleRequest>()
            .ForMember(dest => dest.RoleId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Name));
    }
}
