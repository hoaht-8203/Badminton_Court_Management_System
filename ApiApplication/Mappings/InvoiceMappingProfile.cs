using ApiApplication.Dtos.Invoice;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using AutoMapper;

namespace ApiApplication.Mappings;

public class InvoiceMappingProfile : Profile
{
	public InvoiceMappingProfile()
	{
        CreateMap<Invoice, DetailInvoiceResponse>()
			.ForMember(d => d.CustomerId, opt => opt.MapFrom(s => s.Booking != null ? s.Booking.CustomerId : 0))
			.ForMember(d => d.CustomerName, opt => opt.MapFrom(s => s.Booking != null && s.Booking.Customer != null ? s.Booking.Customer.FullName : string.Empty))
			.ForMember(d => d.CustomerPhone, opt => opt.MapFrom(s => s.Booking != null && s.Booking.Customer != null ? s.Booking.Customer.PhoneNumber : null))
			.ForMember(d => d.CustomerEmail, opt => opt.MapFrom(s => s.Booking != null && s.Booking.Customer != null ? s.Booking.Customer.Email : null))
			.ForMember(d => d.CourtId, opt => opt.MapFrom(s => s.Booking != null ? s.Booking.CourtId : Guid.Empty))
			.ForMember(d => d.CourtName, opt => opt.MapFrom(s => s.Booking != null && s.Booking.Court != null ? s.Booking.Court.Name : string.Empty));

        // BookingCourt -> Invoice (Pending) for creation
        CreateMap<BookingCourt, Invoice>()
            .ForMember(d => d.Id, opt => opt.MapFrom(_ => Guid.NewGuid()))
            .ForMember(d => d.BookingId, opt => opt.MapFrom(s => s.Id))
            .ForMember(d => d.InvoiceDate, opt => opt.MapFrom(_ => DateTime.UtcNow))
            .ForMember(d => d.Amount, opt => opt.Ignore())
            .ForMember(d => d.Status, opt => opt.MapFrom(_ => InvoiceStatus.Pending));
	}
}


