using ApiApplication.Dtos.Payment;
using ApiApplication.Dtos.Service;

namespace ApiApplication.Dtos.BookingCourt;

public class BookingCourtOccurrenceDto
{
    public Guid Id { get; set; }
    public Guid BookingCourtId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public List<PaymentDto> Payments { get; set; } = [];
    public List<BookingServiceDto> BookingServices { get; set; } = [];
    public List<BookingOrderItemDto> BookingOrderItems { get; set; } = [];
}

public class BookingOrderItemDto
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
