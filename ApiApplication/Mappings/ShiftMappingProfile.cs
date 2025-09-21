using AutoMapper;
using ApiApplication.Entities;
using ApiApplication.Dtos;

namespace ApiApplication.Mappings
{
    public class ShiftMappingProfile : Profile
    {
        public ShiftMappingProfile()
        {
            CreateMap<Shift, ShiftResponse>();
            CreateMap<ShiftRequest, Shift>();
        }
    }
}
