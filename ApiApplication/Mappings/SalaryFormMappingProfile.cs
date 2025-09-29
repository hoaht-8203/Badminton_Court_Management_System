using ApiApplication.Dtos;
using ApiApplication.Entities;
using AutoMapper;

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
