using ApiApplication.Dtos.SupplierBankAccount;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class SupplierBankAccountMappingProfile : Profile
{
    public SupplierBankAccountMappingProfile()
    {
        CreateMap<UpsertBankAccountRequest, SupplierBankAccount>()
            .ForMember(d => d.Id, o => o.Ignore());
    }
}


