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
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CustomerId, o => o.MapFrom(s => s.CustomerId));

        CreateMap<Payment, DetailPaymentResponse>()
            .ForMember(d => d.CustomerId, o => o.MapFrom(s => s.CustomerId))
            .ForMember(
                d => d.CustomerName,
                o => o.MapFrom(s => s.Customer != null ? s.Customer.FullName : string.Empty)
            )
            .ForMember(
                d => d.CustomerPhone,
                o => o.MapFrom(s => s.Customer != null ? s.Customer.PhoneNumber : null)
            )
            .ForMember(
                d => d.CustomerEmail,
                o => o.MapFrom(s => s.Customer != null ? s.Customer.Email : null)
            )
            .ForMember(d => d.BookingId, o => o.MapFrom(s => s.BookingId))
            .ForMember(
                d => d.CourtId,
                o => o.MapFrom(s => s.Booking != null ? s.Booking.CourtId : Guid.Empty)
            )
            .ForMember(
                d => d.CourtName,
                o => o.MapFrom(s => s.Booking != null ? s.Booking.Court!.Name : string.Empty)
            );

        CreateMap<Payment, PaymentDto>()
            .ForMember(d => d.CustomerId, o => o.MapFrom(s => s.CustomerId))
            .ForMember(
                d => d.CustomerName,
                o => o.MapFrom(s => s.Customer != null ? s.Customer.FullName : string.Empty)
            )
            .ForMember(
                d => d.CustomerPhone,
                o => o.MapFrom(s => s.Customer != null ? s.Customer.PhoneNumber : null)
            )
            .ForMember(
                d => d.CustomerEmail,
                o => o.MapFrom(s => s.Customer != null ? s.Customer.Email : null)
            )
            .ForMember(
                d => d.CourtId,
                o => o.MapFrom(s => s.Booking != null ? s.Booking.CourtId : Guid.Empty)
            )
            .ForMember(
                d => d.CourtName,
                o => o.MapFrom(s => s.Booking != null ? s.Booking.Court!.Name : string.Empty)
            )
            .ForMember(d => d.BookingId, o => o.MapFrom(s => s.BookingId))
            .ForMember(d => d.PaymentCreatedAt, o => o.MapFrom(s => s.PaymentCreatedAt));
    }
}
