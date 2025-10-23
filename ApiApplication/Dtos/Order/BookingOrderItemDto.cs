using System;

namespace ApiApplication.Dtos.Order;

public class OrderBookingOrderItemDto
{
    public Guid Id { get; set; }
    public Guid BookingCourtOccurrenceId { get; set; }
    public int ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? Image { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}
