using System;
using ApiApplication.Dtos.Service;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class ServiceMappingProfile : Profile
{
    public ServiceMappingProfile()
    {
        CreateMap<ServicePricingRule, ServicePricingRuleDto>();

        CreateMap<Service, ListServiceResponse>()
            .ForMember(
                d => d.Pricing,
                opt =>
                    opt.MapFrom(s =>
                        s.ServicePricingRules.Count > 0 ? s.ServicePricingRules.First() : null
                    )
            );

        CreateMap<Service, DetailServiceResponse>()
            .ForMember(
                d => d.Pricing,
                opt =>
                    opt.MapFrom(s =>
                        s.ServicePricingRules.Count > 0 ? s.ServicePricingRules.First() : null
                    )
            );

        CreateMap<CreateServiceRequest, Service>()
            .ForMember(d => d.Id, opt => opt.MapFrom(_ => Guid.NewGuid()))
            .ForMember(d => d.Status, opt => opt.Ignore());

        CreateMap<UpdateServiceRequest, Service>();

        // Pricing rule mappings
        CreateMap<CreateServiceRequest, ServicePricingRule>()
            .ForMember(d => d.Id, opt => opt.MapFrom(_ => Guid.NewGuid()))
            .ForMember(d => d.ServiceId, opt => opt.Ignore())
            .ForMember(d => d.Service, opt => opt.Ignore())
            .ForMember(d => d.PricePerHour, opt => opt.MapFrom(s => s.PricePerHour));

        CreateMap<UpdateServicePricingRuleRequest, ServicePricingRule>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.ServiceId, opt => opt.MapFrom(s => s.ServiceId))
            .ForMember(d => d.Service, opt => opt.Ignore());

        CreateMap<CreateServicePricingRuleRequest, ServicePricingRule>()
            .ForMember(d => d.Id, opt => opt.MapFrom(_ => Guid.NewGuid()))
            .ForMember(d => d.Service, opt => opt.Ignore());
    }
}
