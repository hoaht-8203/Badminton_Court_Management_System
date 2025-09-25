using ApiApplication.Dtos;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class PriceTableMappingProfile : Profile
{
    public PriceTableMappingProfile()
    {
        CreateMap<PriceTable, ListPriceTableResponse>();
        CreateMap<PriceTable, DetailPriceTableResponse>()
            .ForMember(d => d.TimeRanges, opt => opt.MapFrom(s => s.TimeRanges));
        CreateMap<PriceTimeRange, PriceTimeRangeDto>();

        CreateMap<CreatePriceTableRequest, PriceTable>()
            .ForMember(d => d.TimeRanges, opt => opt.Ignore());
        CreateMap<PriceTimeRangeDto, PriceTimeRange>()
            .ForMember(d => d.PriceTable, opt => opt.Ignore())
            .ForMember(d => d.PriceTableId, opt => opt.Ignore());

        CreateMap<UpdatePriceTableRequest, PriceTable>()
            .ForMember(d => d.TimeRanges, opt => opt.Ignore())
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
    }
} 