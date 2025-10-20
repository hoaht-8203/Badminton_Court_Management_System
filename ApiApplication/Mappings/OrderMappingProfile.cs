using ApiApplication.Dtos.Order;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class OrderMappingProfile : Profile
{
    public OrderMappingProfile()
    {
        CreateMap<Order, OrderResponse>()
            .ForMember(
                dest => dest.CustomerName,
                opt =>
                    opt.MapFrom(src => src.Customer != null ? src.Customer.FullName : string.Empty)
            )
            .ForMember(
                dest => dest.CourtName,
                opt =>
                    opt.MapFrom(src =>
                        src.Booking != null && src.Booking.Court != null
                            ? src.Booking.Court.Name
                            : string.Empty
                    )
            )
            .ForMember(
                dest => dest.OverdueDisplay,
                opt => opt.MapFrom(src => FormatOverdueTime(src.OverdueMinutes))
            )
            .ForMember(
                dest => dest.Payments,
                opt =>
                    opt.MapFrom(src =>
                        src.Payments.Select(p => new PaymentSummary
                        {
                            Id = p.Id,
                            Amount = p.Amount,
                            Status = p.Status,
                            PaymentCreatedAt = p.PaymentCreatedAt,
                            Note = p.Note,
                        })
                    )
            )
            .ForMember(
                dest => dest.OrderItems,
                opt =>
                    opt.MapFrom(src =>
                        src.Booking != null && src.Booking.BookingCourtOccurrences != null
                            ? src
                                .Booking.BookingCourtOccurrences.SelectMany(o =>
                                    o.BookingOrderItems
                                )
                                .Select(oi => new OrderItemSummary
                                {
                                    ProductId = oi.ProductId,
                                    ProductName =
                                        oi.Product != null ? oi.Product.Name : string.Empty,
                                    Image =
                                        oi.Product != null && oi.Product.Images != null
                                            ? oi.Product.Images.FirstOrDefault()
                                            : null,
                                    UnitPrice = oi.UnitPrice,
                                    Quantity = oi.Quantity,
                                    TotalPrice = oi.TotalPrice,
                                })
                            : Enumerable.Empty<OrderItemSummary>()
                    )
            );

        CreateMap<Order, CheckoutResponse>()
            .ForMember(
                dest => dest.CustomerName,
                opt =>
                    opt.MapFrom(src => src.Customer != null ? src.Customer.FullName : string.Empty)
            )
            .ForMember(
                dest => dest.CourtName,
                opt =>
                    opt.MapFrom(src =>
                        src.Booking != null && src.Booking.Court != null
                            ? src.Booking.Court.Name
                            : string.Empty
                    )
            )
            .ForMember(
                dest => dest.OverdueDisplay,
                opt => opt.MapFrom(src => FormatOverdueTime(src.OverdueMinutes))
            )
            .ForMember(
                dest => dest.PaymentId,
                opt =>
                    opt.MapFrom(src =>
                        src.Payments.FirstOrDefault() != null
                            ? src.Payments.FirstOrDefault()!.Id
                            : string.Empty
                    )
            )
            .ForMember(dest => dest.PaymentAmount, opt => opt.MapFrom(src => src.TotalAmount))
            .ForMember(dest => dest.QrUrl, opt => opt.Ignore())
            .ForMember(dest => dest.HoldMinutes, opt => opt.Ignore())
            .ForMember(dest => dest.ExpiresAtUtc, opt => opt.Ignore());
    }

    private static string FormatOverdueTime(int overdueMinutes)
    {
        if (overdueMinutes <= 0)
            return "0 phút";

        if (overdueMinutes >= 60)
        {
            var hours = Math.Floor(overdueMinutes / 60.0);
            var minutes = overdueMinutes % 60;
            return $"{hours} giờ {minutes} phút";
        }

        return $"{overdueMinutes} phút";
    }
}
