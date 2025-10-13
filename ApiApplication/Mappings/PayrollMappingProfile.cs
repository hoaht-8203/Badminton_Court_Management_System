using System;
using ApiApplication.Dtos.Payroll;
using ApiApplication.Entities;

namespace ApiApplication.Mappings;

public class PayrollMappingProfile : AutoMapper.Profile
{
    public PayrollMappingProfile()
    {
        CreateMap<CreatePayrollRequest, Payroll>();
        CreateMap<Payroll, PayrollDetailResponse>()
            .ForMember(dest => dest.PayrollItems, opt => opt.MapFrom(src => src.PayrollItems));
        CreateMap<Payroll, ListPayrollResponse>();
        CreateMap<PayrollItem, PayrollItemResponse>()
            .ForMember(dest => dest.StaffName, opt => opt.MapFrom(src => src.Staff!.FullName ?? string.Empty));
    }
}
