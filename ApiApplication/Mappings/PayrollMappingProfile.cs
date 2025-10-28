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
            .ForMember(dest => dest.StaffId, opt => opt.MapFrom(src => src.StaffId))
            .ForMember(dest => dest.Staff, opt => opt.MapFrom(src => src.Staff))
            .ForMember(dest => dest.PayrollId, opt => opt.MapFrom(src => src.PayrollId))
            .ForMember(dest => dest.PayrollName, opt => opt.MapFrom(src => src.Payroll != null ? src.Payroll.Name : null))
            .ForMember(dest => dest.PayrollStartDate, opt => opt.MapFrom(src => src.Payroll != null ? src.Payroll.StartDate : default))
            .ForMember(dest => dest.PayrollEndDate, opt => opt.MapFrom(src => src.Payroll != null ? src.Payroll.EndDate : default))
            .ForMember(dest => dest.PayrollCreatedAt, opt => opt.MapFrom(src => src.Payroll != null ? src.Payroll.CreatedAt : DateTime.MinValue));
    }
}
