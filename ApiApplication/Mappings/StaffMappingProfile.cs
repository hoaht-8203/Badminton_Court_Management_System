using AutoMapper;
using ApiApplication.Entities;
using ApiApplication.Dtos;

namespace ApiApplication.Mappings
{
    public class StaffMappingProfile : Profile
    {
        public StaffMappingProfile()
        {
            CreateMap<Staff, StaffResponse>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.FullName))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User != null ? src.User.Email : null))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.AvatarUrl))
                .ForMember(dest => dest.SalarySettings, opt => opt.MapFrom(src => src.SalarySettings));

            CreateMap<StaffRequest, Staff>()
                .ForMember(dest => dest.SalarySettings, opt => opt.MapFrom(src => src.SalarySettings));
        }
    }
}