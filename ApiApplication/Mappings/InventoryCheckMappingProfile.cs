using ApiApplication.Dtos.InventoryCheck;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class InventoryCheckMappingProfile : Profile
{
    public InventoryCheckMappingProfile()
    {
        CreateMap<CreateInventoryCheckRequest, InventoryCheck>();
        CreateMap<CreateInventoryCheckItem, InventoryCheckItem>();

        CreateMap<InventoryCheckItem, InventoryCheckItemResponse>()
            .ForMember(d => d.ProductCode, opt => opt.MapFrom(s => s.Product.Code ?? string.Empty))
            .ForMember(d => d.ProductName, opt => opt.MapFrom(s => s.Product.Name));

        CreateMap<InventoryCheck, DetailInventoryCheckResponse>()
            .ForMember(d => d.Items, opt => opt.MapFrom(s => s.Items))
            .ForMember(d => d.BalancedAt, opt => opt.MapFrom(s => s.BalancedAt))
            .ForMember(d => d.CreatedBy, opt => opt.MapFrom(s => s.CreatedBy));

        CreateMap<InventoryCheck, ListInventoryCheckResponse>()
            .ForMember(d => d.TotalDelta, opt => opt.MapFrom(s => (s.Items ?? new List<InventoryCheckItem>()).Sum(i => i.ActualQuantity - i.SystemQuantity)))
            .ForMember(d => d.TotalDeltaIncrease, opt => opt.MapFrom(s => (s.Items ?? new List<InventoryCheckItem>()).Sum(i => Math.Max(0, i.ActualQuantity - i.SystemQuantity))))
            .ForMember(d => d.TotalDeltaDecrease, opt => opt.MapFrom(s => (s.Items ?? new List<InventoryCheckItem>()).Sum(i => Math.Max(0, i.SystemQuantity - i.ActualQuantity))));
    }
} 