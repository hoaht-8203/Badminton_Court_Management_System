using ApiApplication.Dtos;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class SystemConfigMappingProfile : Profile
{
    public SystemConfigMappingProfile()
    {
        CreateMap<SystemConfig, SystemConfigResponse>();
        CreateMap<SystemConfigRequest, SystemConfig>();
    }
}
