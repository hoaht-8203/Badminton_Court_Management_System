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
        CreateMap<DateTime, DateOnly>().ConvertUsing(src => DateOnly.FromDateTime(src));
        CreateMap<DateOnly?, DateTime?>()
            .ConvertUsing(src =>
                src.HasValue ? src.Value.ToDateTime(TimeOnly.MinValue) : (DateTime?)null
            );
        CreateMap<DateOnly, DateTime>().ConvertUsing(src => src.ToDateTime(TimeOnly.MinValue));

        CreateMap<BookingCourt, DetailBookingCourtResponse>()
            .ForMember(
                d => d.TotalHours,
                opt =>
                    opt.MapFrom(s =>
                        (decimal)(s.EndTime.ToTimeSpan() - s.StartTime.ToTimeSpan()).TotalHours
                    )
            )
            .ForMember(d => d.CourtName, opt => opt.MapFrom(s => s.Court!.Name))
            .ForMember(d => d.Customer, opt => opt.MapFrom(s => s.Customer))
            .ForMember(d => d.Payments, opt => opt.MapFrom(s => s.Payments))
            .ForMember(
                d => d.BookingServices,
                opt =>
                    opt.MapFrom(s => s.BookingCourtOccurrences.SelectMany(o => o.BookingServices))
            )
            .ForMember(
                d => d.BookingCourtOccurrences,
                opt => opt.MapFrom(s => s.BookingCourtOccurrences)
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

        CreateMap<BookingCourtOccurrence, BookingCourtOccurrenceDto>()
            .ForMember(d => d.Payments, opt => opt.MapFrom(s => s.Payments))
            .ForMember(d => d.BookingServices, opt => opt.MapFrom(s => s.BookingServices))
            .ForMember(d => d.BookingOrderItems, opt => opt.MapFrom(s => s.BookingOrderItems));

        CreateMap<BookingCourtOccurrence, DetailBookingCourtOccurrenceResponse>()
            .ForMember(
                d => d.TotalHours,
                opt =>
                    opt.MapFrom(s =>
                        (decimal)(s.EndTime.ToTimeSpan() - s.StartTime.ToTimeSpan()).TotalHours
                    )
            )
            .ForMember(d => d.Customer, opt => opt.MapFrom(s => s.BookingCourt.Customer))
            .ForMember(d => d.Payments, opt => opt.MapFrom(s => s.Payments))
            .ForMember(d => d.BookingServices, opt => opt.MapFrom(s => s.BookingServices))
            .ForMember(d => d.BookingOrderItems, opt => opt.MapFrom(s => s.BookingOrderItems));

        CreateMap<BookingOrderItem, BookingOrderItemDto>()
            .ForMember(d => d.ProductName, opt => opt.MapFrom(s => s.Product!.Name))
            .ForMember(
                d => d.Image,
                opt =>
                    opt.MapFrom(s =>
                        s.Product!.Images != null ? s.Product.Images.FirstOrDefault() : null
                    )
            );

        CreateMap<BookingOrderItem, BookingOrderItemResponse>()
            .ForMember(d => d.ProductName, opt => opt.MapFrom(s => s.Product!.Name))
            .ForMember(
                d => d.Image,
                opt =>
                    opt.MapFrom(s =>
                        s.Product!.Images != null ? s.Product.Images.FirstOrDefault() : null
                    )
            );
    }
}
