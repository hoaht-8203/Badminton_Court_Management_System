using ApiApplication.Dtos.Category;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class CategoryMappingProfile : Profile
{
    public CategoryMappingProfile()
    {
        CreateMap<Category, ListCategoryResponse>();
        CreateMap<Category, DetailCategoryResponse>();
        CreateMap<CreateCategoryRequest, Category>();
        CreateMap<UpdateCategoryRequest, Category>()
            .ForMember(dest => dest.Id, opt => opt.Ignore());
    }
}
