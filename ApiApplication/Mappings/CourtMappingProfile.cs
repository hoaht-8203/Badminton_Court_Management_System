using System;
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
                d => d.CourtAreaName,
                opt => opt.MapFrom(s => s.CourtArea != null ? s.CourtArea.Name : string.Empty)
            );

        CreateMap<Court, DetailCourtResponse>()
            .ForMember(
                d => d.CourtAreaName,
                opt => opt.MapFrom(s => s.CourtArea != null ? s.CourtArea.Name : string.Empty)
            );

        // Requests → Court
        CreateMap<CreateCourtRequest, Court>()
            .ForMember(d => d.Id, opt => opt.MapFrom(_ => Guid.NewGuid()))
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.CourtPricingRules, opt => opt.Ignore());
        CreateMap<UpdateCourtRequest, Court>()
            .ForMember(dest => dest.CourtPricingRules, opt => opt.Ignore());
        CreateMap<CreateCourtPricingRulesRequest, CourtPricingRules>()
            .ForMember(d => d.Id, opt => opt.MapFrom(_ => Guid.NewGuid()))
            .ForMember(d => d.CourtId, opt => opt.Ignore());
        CreateMap<CourtPricingRules, CourtPricingRuleDto>();
        CreateMap<CreateCourtPricingRuleTemplateRequest, CourtPricingRuleTemplate>()
            .ForMember(d => d.Id, opt => opt.MapFrom(_ => Guid.NewGuid()));
        CreateMap<CourtPricingRuleTemplate, CourtPricingRuleTemplateDto>();
        CreateMap<UpdateCourtPricingRuleTemplateRequest, CourtPricingRuleTemplate>();
        CreateMap<DeleteCourtPricingRuleTemplateRequest, CourtPricingRuleTemplate>();
    }
}
