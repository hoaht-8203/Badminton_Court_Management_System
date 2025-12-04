using ApiApplication.Dtos.Membership;
using ApiApplication.Dtos.Membership.UserMembership;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class MembershipMappingProfile : Profile
{
    public MembershipMappingProfile()
    {
        // Membership
        CreateMap<Membership, ListMembershipResponse>();
        CreateMap<Membership, DetailMembershipResponse>();
        CreateMap<CreateMembershipRequest, Membership>();
        CreateMap<UpdateMembershipRequest, Membership>()
            .ForMember(dest => dest.Id, opt => opt.Ignore());

        // UserMembership
        CreateMap<CreateUserMembershipRequest, UserMembership>();
        CreateMap<UserMembership, UserMembershipResponse>()
            .ForMember(
                dest => dest.MembershipName,
                opt => opt.MapFrom(src => src.Membership != null ? src.Membership.Name : null)
            )
            .ForMember(dest => dest.Customer, opt => opt.MapFrom(src => src.Customer))
            .ForMember(dest => dest.Payment, opt => opt.Ignore())
            .ForMember(dest => dest.Payments, opt => opt.Ignore());
        CreateMap<UserMembership, ListUserMembershipResponse>()
            .ForMember(
                dest => dest.MembershipName,
                opt => opt.MapFrom(src => src.Membership != null ? src.Membership.Name : null)
            )
            .ForMember(dest => dest.Customer, opt => opt.MapFrom(src => src.Customer))
            .ForMember(
                dest => dest.Payments,
                opt => opt.MapFrom(src => src.Payments.OrderByDescending(p => p.CreatedAt))
            );
        CreateMap<UserMembership, DetailUserMembershipResponse>()
            .ForMember(
                dest => dest.MembershipName,
                opt => opt.MapFrom(src => src.Membership != null ? src.Membership.Name : null)
            )
            .ForMember(dest => dest.Customer, opt => opt.MapFrom(src => src.Customer))
            .ForMember(
                dest => dest.Payments,
                opt => opt.MapFrom(src => src.Payments.OrderByDescending(p => p.CreatedAt))
            );
    }
}
