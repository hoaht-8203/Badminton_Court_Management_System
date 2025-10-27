using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class BookingCourtOccurrence : BaseEntity
{
    [Key]
    public Guid Id { get; set; }

    public required Guid BookingCourtId { get; set; }

    [ForeignKey(nameof(BookingCourtId))]
    public BookingCourt BookingCourt { get; set; } = null!;

    public required DateOnly Date { get; set; }
    public required TimeOnly StartTime { get; set; }
    public required TimeOnly EndTime { get; set; }

    public string Status { get; set; } = BookingCourtOccurrenceStatus.Active;

    public string? Note { get; set; }

    public ICollection<Payment> Payments { get; set; } = [];
    public ICollection<BookingService> BookingServices { get; set; } = [];
    public ICollection<BookingOrderItem> BookingOrderItems { get; set; } = [];
}
