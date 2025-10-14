using ApiApplication.Dtos.Receipt;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class ReceiptMappingProfile : Profile
{
    public ReceiptMappingProfile()
    {
        CreateMap<Receipt, ListReceiptResponse>()
            .ForMember(d => d.SupplierName, o => o.MapFrom(s => s.Supplier.Name))
            .ForMember(d => d.NeedPay, o => o.MapFrom(s => s.PaymentAmount))
            .ForMember(d => d.Status, o => o.MapFrom(s => (int)s.Status));

        CreateMap<CreateReceiptRequest, Receipt>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.Code, o => o.Ignore())
            .ForMember(d => d.Items, o => o.Ignore())
            .ForAllMembers(o => o.Condition((_, __, srcVal) => srcVal != null));
    }
}


