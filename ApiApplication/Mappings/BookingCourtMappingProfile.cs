using ApiApplication.Dtos.BookingCourt;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class BookingCourtMappingProfile : Profile
{
	public BookingCourtMappingProfile()
	{
		CreateMap<BookingCourt, DetailBookingCourtResponse>();
		CreateMap<BookingCourt, ListBookingCourtResponse>();
		CreateMap<CreateBookingCourtRequest, BookingCourt>()
			.ForMember(d => d.Id, opt => opt.MapFrom(_ => Guid.NewGuid()));
	}
}


