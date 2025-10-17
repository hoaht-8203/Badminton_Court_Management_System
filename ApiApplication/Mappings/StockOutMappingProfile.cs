using ApiApplication.Constants;
using ApiApplication.Dtos.StockOut;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings
{
    public class StockOutMappingProfile : Profile
    {
        public StockOutMappingProfile()
        {
            CreateMap<CreateStockOutRequest, StockOut>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Code, opt => opt.Ignore())
                .ForMember(
                    dest => dest.Status,
                    opt =>
                        opt.MapFrom(src =>
                            src.Complete ? StockOutStatus.Completed : StockOutStatus.Draft
                        )
                )
                .ForMember(dest => dest.TotalValue, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Items, opt => opt.Ignore());

            CreateMap<CreateStockOutItem, StockOutItem>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.StockOutId, opt => opt.Ignore())
                .ForMember(dest => dest.StockOut, opt => opt.Ignore())
                .ForMember(dest => dest.Product, opt => opt.Ignore());

            CreateMap<StockOut, ListStockOutResponse>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => (int)src.Status));

            CreateMap<StockOut, DetailStockOutResponse>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => (int)src.Status));

            CreateMap<StockOutItem, DetailStockOutItem>()
                .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Product.Code))
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name));
        }
    }
}
