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

        CreateMap<CreateCashflowRequest, Cashflow>();

        CreateMap<UpdateCashflowRequest, Cashflow>()
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
    }
}
