using ApiApplication.Dtos.Blog;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class BlogMappingProfile : Profile
{
    public BlogMappingProfile()
    {
        CreateMap<Blog, ListBlogResponse>();
        CreateMap<Blog, DetailBlogResponse>();
        CreateMap<CreateBlogRequest, Blog>();
        CreateMap<UpdateBlogRequest, Blog>();
    }
}
