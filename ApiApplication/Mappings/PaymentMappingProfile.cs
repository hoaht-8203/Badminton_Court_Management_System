using ApiApplication.Dtos.Payment;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class PaymentMappingProfile : Profile
{
    public PaymentMappingProfile()
    {
        CreateMap<BookingCourt, Payment>()
            .ForMember(d => d.BookingId, o => o.MapFrom(s => s.Id))
            .ForMember(d => d.Amount, o => o.Ignore())
            .ForMember(d => d.Id, o => o.Ignore());

        CreateMap<Payment, DetailPaymentResponse>()
            .ForMember(d => d.CustomerId, o => o.MapFrom(s => s.Booking!.CustomerId))
            .ForMember(d => d.CustomerName, o => o.MapFrom(s => s.Booking!.Customer!.FullName))
            .ForMember(d => d.CustomerPhone, o => o.MapFrom(s => s.Booking!.Customer!.PhoneNumber))
            .ForMember(d => d.CustomerEmail, o => o.MapFrom(s => s.Booking!.Customer!.Email))
            .ForMember(d => d.CourtId, o => o.MapFrom(s => s.Booking!.CourtId))
            .ForMember(d => d.CourtName, o => o.MapFrom(s => s.Booking!.Court!.Name));
    }
}
