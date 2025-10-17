using ApiApplication.Dtos.InventoryCard;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class InventoryCardMappingProfile : Profile
{
    public InventoryCardMappingProfile()
    {
        CreateMap<InventoryCard, ListByProductResponse>();
    }
}
