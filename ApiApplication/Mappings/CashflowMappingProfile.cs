using ApiApplication.Dtos.Cashflow;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class CashflowMappingProfile : Profile
{
    public CashflowMappingProfile()
    {
        CreateMap<Cashflow, CashflowResponse>()
            .ForMember(d => d.CashflowTypeName, opt => opt.MapFrom(s => s.CashflowType.Name));

        CreateMap<CreateCashflowRequest, Cashflow>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.IsPayment, opt => opt.Ignore())
            .ForMember(d => d.CashflowType, opt => opt.Ignore())
            .ForMember(d => d.Status, opt => opt.Ignore());

        CreateMap<UpdateCashflowRequest, Cashflow>()
            .ForMember(d => d.IsPayment, opt => opt.Ignore())
            .ForMember(d => d.CashflowType, opt => opt.Ignore())
            .ForMember(d => d.Status, opt => opt.Ignore());
    }
}


