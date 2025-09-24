using ApiApplication.Dtos.CourtArea;
using ApiApplication.Dtos.Customer;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class CourtAreaMappingProfile : Profile
{
    public CourtAreaMappingProfile()
    {
        CreateMap<CreateCourtAreaRequest, CourtArea>();
        CreateMap<UpdateCourtAreaRequest, CourtArea>();
        CreateMap<CourtArea, ListCourtAreaResponse>();
        CreateMap<CourtArea, DetailCourtAreaResponse>();
    }
}
