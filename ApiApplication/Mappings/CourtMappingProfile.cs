using ApiApplication.Dtos.Court;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class CourtMappingProfile : Profile
{
    public CourtMappingProfile()
    {
        // Court → DTOs
        CreateMap<Court, ListCourtResponse>()
            .ForMember(
                d => d.PriceUnitName,
                opt => opt.MapFrom(s => s.PriceUnit != null ? s.PriceUnit.Name : string.Empty)
            )
            .ForMember(
                d => d.CourtAreaName,
                opt => opt.MapFrom(s => s.CourtArea != null ? s.CourtArea.Name : string.Empty)
            );

        CreateMap<Court, DetailCourtResponse>()
            .ForMember(
                d => d.PriceUnitName,
                opt => opt.MapFrom(s => s.PriceUnit != null ? s.PriceUnit.Name : string.Empty)
            )
            .ForMember(
                d => d.CourtAreaName,
                opt => opt.MapFrom(s => s.CourtArea != null ? s.CourtArea.Name : string.Empty)
            );

        // Requests → Court
        CreateMap<CreateCourtRequest, Court>()
            .ForMember(d => d.Id, opt => opt.MapFrom(_ => Guid.NewGuid()))
            .ForMember(dest => dest.Status, opt => opt.Ignore());
        CreateMap<UpdateCourtRequest, Court>();
    }
}
