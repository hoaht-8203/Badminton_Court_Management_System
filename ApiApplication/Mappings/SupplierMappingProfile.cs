using System;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Supplier;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class SupplierMappingProfile : Profile
{
    public SupplierMappingProfile()
    {
        CreateMap<Supplier, ListSupplierResponse>();
        CreateMap<Supplier, DetailSupplierResponse>();

        CreateMap<CreateSupplierRequest, Supplier>()
            .ForMember(dest => dest.Status, opt => opt.Ignore());

        CreateMap<UpdateSupplierRequest, Supplier>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
    }
}
