using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Order;

public class OrderBookingCourtOccurrenceDto : BaseEntity
{
    public Guid Id { get; set; }
    public Guid BookingCourtId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
}
