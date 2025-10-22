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
            .ForMember(
                d => d.Time,
                opt =>
                    opt.MapFrom(s =>
                        s.Time.HasValue
                            ? (
                                s.Time.Value.Kind == DateTimeKind.Utc
                                    ? DateTime.SpecifyKind(s.Time.Value, DateTimeKind.Utc)
                                    : DateTime.SpecifyKind(
                                        s.Time.Value.ToUniversalTime(),
                                        DateTimeKind.Utc
                                    )
                            )
                            : (DateTime?)null
                    )
            );

        CreateMap<UpdateCashflowRequest, Cashflow>()
            .ForMember(
                d => d.Time,
                opt =>
                    opt.MapFrom(s =>
                        s.Time != null
                            ? (
                                s.Time.Value.Kind == DateTimeKind.Utc
                                    ? s.Time.Value
                                    : s.Time.Value.ToUniversalTime()
                            )
                            : (DateTime?)null
                    )
            )
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
    }
}
