using System;

namespace ApiApplication.Dtos.Order;

public class OrderBookingServiceDto
{
    public Guid Id { get; set; }
    public Guid BookingCourtOccurrenceId { get; set; }
    public Guid ServiceId { get; set; }
    public required string ServiceName { get; set; }
    public string? Image { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal Hours { get; set; }
    public DateTime ServiceStartTime { get; set; }
    public DateTime? ServiceEndTime { get; set; }
}
