using ApiApplication.Dtos.BookingCourt;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class BookingCourtMappingProfile : Profile
{
	public BookingCourtMappingProfile()
	{
		CreateMap<BookingCourt, DetailBookingCourtResponse>()
			.ForMember(d => d.TotalHours, opt => opt.MapFrom(s => (decimal)(s.EndTime.ToTimeSpan() - s.StartTime.ToTimeSpan()).TotalHours));
		CreateMap<BookingCourt, ListBookingCourtResponse>()
			.ForMember(d => d.TotalHours, opt => opt.MapFrom(s => (decimal)(s.EndTime.ToTimeSpan() - s.StartTime.ToTimeSpan()).TotalHours));
		CreateMap<CreateBookingCourtRequest, BookingCourt>()
			.ForMember(d => d.Id, opt => opt.MapFrom(_ => Guid.NewGuid()));
	}
}


