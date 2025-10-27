using ApiApplication.Dtos.Service;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class ServiceMappingProfile : Profile
{
    public ServiceMappingProfile()
    {
        CreateMap<Service, ListServiceResponse>();
        CreateMap<Service, DetailServiceResponse>();
        CreateMap<CreateServiceRequest, Service>();
        CreateMap<UpdateServiceRequest, Service>();

        CreateMap<BookingService, BookingServiceDto>()
            .ForMember(dest => dest.ServiceName, opt => opt.MapFrom(src => src.Service.Name))
            .ForMember(dest => dest.ServiceCode, opt => opt.MapFrom(src => src.Service.Code));
    }
}
