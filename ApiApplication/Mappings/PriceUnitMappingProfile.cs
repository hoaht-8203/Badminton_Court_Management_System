using ApiApplication.Dtos.PriceUnit;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class PriceUnitMappingProfile : Profile
{
    public PriceUnitMappingProfile()
    {
        CreateMap<PriceUnit, ListPriceUnitResponse>();
        CreateMap<PriceUnit, DetailPriceUnitResponse>();
        CreateMap<CreatePriceUnitRequest, PriceUnit>();
        CreateMap<UpdatePriceUnitRequest, PriceUnit>();
    }
}
