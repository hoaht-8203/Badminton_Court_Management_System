using AutoMapper;
using ApiApplication.Entities;
using ApiApplication.Dtos;

namespace ApiApplication.Mappings
{
    public class SalaryFormMappingProfile : Profile
    {
        public SalaryFormMappingProfile()
        {
            CreateMap<SalaryForm, SalaryFormResponse>();
            CreateMap<SalaryFormRequest, SalaryForm>();
        }
    }
}
