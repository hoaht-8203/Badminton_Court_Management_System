using ApiApplication.Dtos;
using ApiApplication.Dtos.Activity;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class ActivityMappingProfile : Profile
{
    public ActivityMappingProfile()
    {
        CreateMap<Activity, ListActivityResponse>();
        CreateMap<CreateActivityRequest, Activity>();
    }
}
