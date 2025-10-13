using ApiApplication.Dtos;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings
{
    public class StaffMappingProfile : Profile
    {
        public StaffMappingProfile()
        {
            CreateMap<Staff, StaffResponse>();

            CreateMap<StaffRequest, Staff>()
                .ForMember(
                    dest => dest.SalarySettings,
                    opt => opt.MapFrom(src => src.SalarySettings)
                )
                .ForMember(
                    dest => dest.UserId,
                    opt => opt.MapFrom(src => src.AccountId)
                );
        }
    }
}
