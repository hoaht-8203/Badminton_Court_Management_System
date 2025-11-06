using ApiApplication.Dtos.Voucher;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class VoucherMappingProfile : Profile
{
    public VoucherMappingProfile()
    {
        // Entity to Response
        CreateMap<Voucher, VoucherResponse>();

        // Request to Entity
        CreateMap<CreateVoucherRequest, Voucher>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UsedCount, opt => opt.Ignore())
            .ForMember(dest => dest.TimeRules, opt => opt.Ignore())
            .ForMember(dest => dest.UserRules, opt => opt.Ignore());

        CreateMap<UpdateVoucherRequest, Voucher>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UsedCount, opt => opt.Ignore())
            .ForMember(dest => dest.TimeRules, opt => opt.Ignore())
            .ForMember(dest => dest.UserRules, opt => opt.Ignore())
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

        // TimeRule and UserRule mappings
        CreateMap<VoucherTimeRule, VoucherTimeRuleDto>();
        CreateMap<VoucherTimeRuleDto, VoucherTimeRule>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.VoucherId, opt => opt.Ignore())
            .ForMember(dest => dest.Voucher, opt => opt.Ignore());

        CreateMap<VoucherUserRule, VoucherUserRuleDto>();
        CreateMap<VoucherUserRuleDto, VoucherUserRule>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.VoucherId, opt => opt.Ignore())
            .ForMember(dest => dest.Voucher, opt => opt.Ignore());
    }
}
