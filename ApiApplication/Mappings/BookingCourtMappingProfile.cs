using ApiApplication.Dtos.BookingCourt;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class BookingCourtMappingProfile : Profile
{
    public BookingCourtMappingProfile()
    {
        CreateMap<DateTime?, DateOnly?>()
            .ConvertUsing(src => src.HasValue ? DateOnly.FromDateTime(src.Value) : null);
        CreateMap<DateTime, DateOnly>()
            .ConvertUsing(src => DateOnly.FromDateTime(src));
        CreateMap<DateOnly?, DateTime?>()
            .ConvertUsing(src =>
                src.HasValue ? src.Value.ToDateTime(TimeOnly.MinValue) : (DateTime?)null
            );
        CreateMap<DateOnly, DateTime>()
            .ConvertUsing(src => src.ToDateTime(TimeOnly.MinValue));

        CreateMap<BookingCourt, DetailBookingCourtResponse>()
            .ForMember(
                d => d.TotalHours,
                opt =>
                    opt.MapFrom(s =>
                        (decimal)(s.EndTime.ToTimeSpan() - s.StartTime.ToTimeSpan()).TotalHours
                    )
            );
        CreateMap<BookingCourt, ListBookingCourtResponse>()
            .ForMember(
                d => d.TotalHours,
                opt =>
                    opt.MapFrom(s =>
                        (decimal)(s.EndTime.ToTimeSpan() - s.StartTime.ToTimeSpan()).TotalHours
                        )
            )
            .ForMember(d => d.CourtName, opt => opt.MapFrom(s => s.Court!.Name))
            .ForMember(d => d.CustomerName, opt => opt.MapFrom(s => s.Customer!.FullName))
            .ForMember(d => d.Customer, opt => opt.MapFrom(s => s.Customer))
            .ForMember(d => d.Payments, opt => opt.MapFrom(s => s.Payments));

        CreateMap<CreateBookingCourtRequest, BookingCourt>()
            .ForMember(d => d.Id, opt => opt.MapFrom(_ => Guid.NewGuid()));
    }
}
