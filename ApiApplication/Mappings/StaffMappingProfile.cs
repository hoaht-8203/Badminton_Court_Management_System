using AutoMapper;
using ApiApplication.Entities;
using ApiApplication.Dtos;

namespace ApiApplication.Mappings
{
    public class StaffMappingProfile : Profile
    {
        public StaffMappingProfile()
        {
            CreateMap<Staff, StaffResponse>();

            CreateMap<StaffRequest, Staff>()
                .ForMember(dest => dest.SalarySettings, opt => opt.MapFrom(src => src.SalarySettings));
        }
    }
}