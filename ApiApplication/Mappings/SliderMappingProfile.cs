using ApiApplication.Dtos.Slider;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class SliderMappingProfile : Profile
{
    public SliderMappingProfile()
    {
        CreateMap<Slider, ListSliderResponse>();
        CreateMap<Slider, DetailSliderResponse>();
        CreateMap<CreateSliderRequest, Slider>();
        CreateMap<UpdateSliderRequest, Slider>();
    }
}
