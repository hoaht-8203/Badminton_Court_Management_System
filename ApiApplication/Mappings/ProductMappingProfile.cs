using ApiApplication.Dtos;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class ProductMappingProfile : Profile
{
    public ProductMappingProfile()
    {
        CreateMap<Product, ListProductResponse>();
        CreateMap<Product, DetailProductResponse>();

        CreateMap<CreateProductRequest, Product>()
            .ForMember(
                dest => dest.Images,
                opt => opt.MapFrom(src => (src.Images ?? new List<string>()).ToArray())
            );

        CreateMap<UpdateProductRequest, Product>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Images, opt => opt.Ignore())
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
    }
}
