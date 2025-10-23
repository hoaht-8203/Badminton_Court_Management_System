using System;
using ApiApplication.Dtos.Customer;
using ApiApplication.Dtos.Payment;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Order;

public class ListOrderResponse : BaseEntity
{
    public Guid Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public Guid BookingId { get; set; }
    public OrderBookingCourtDto Booking { get; set; } = null!;
    public Guid BookingCourtOccurrenceId { get; set; }
    public OrderBookingCourtOccurrenceDto BookingCourtOccurrence { get; set; } = null!;
    public int CustomerId { get; set; }
    public CustomerDto Customer { get; set; } = null!;
    public string CourtName { get; set; } = string.Empty;
    public string CourtAreaName { get; set; } = string.Empty;
    public decimal CourtTotalAmount { get; set; }
    public decimal CourtPaidAmount { get; set; }
    public decimal CourtRemainingAmount { get; set; }
    public decimal ItemsSubtotal { get; set; }
    public decimal ServicesSubtotal { get; set; }
    public decimal LateFeePercentage { get; set; }
    public decimal LateFeeAmount { get; set; }
    public int OverdueMinutes { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string? Note { get; set; }
    public List<PaymentDto> Payments { get; set; } = [];
    public List<OrderBookingOrderItemDto> OrderItems { get; set; } = [];
    public List<OrderBookingServiceDto> Services { get; set; } = [];
}
