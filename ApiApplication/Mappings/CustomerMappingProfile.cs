using ApiApplication.Dtos.Customer;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class CustomerMappingProfile : Profile
{
    public CustomerMappingProfile()
    {
        CreateMap<DateTime?, DateOnly?>()
            .ConvertUsing(src => src.HasValue ? DateOnly.FromDateTime(src.Value) : null);
        CreateMap<DateOnly?, DateTime?>()
            .ConvertUsing(src =>
                src.HasValue ? src.Value.ToDateTime(TimeOnly.MinValue) : (DateTime?)null
            );

        CreateMap<Customer, ListCustomerResponse>();
        CreateMap<Customer, DetailCustomerResponse>();

        CreateMap<CreateCustomerRequest, Customer>()
            .ForMember(dest => dest.Status, opt => opt.Ignore());

        CreateMap<UpdateCustomerRequest, Customer>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
    }
}
