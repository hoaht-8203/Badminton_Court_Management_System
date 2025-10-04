using System;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Payment : BaseEntity
{
    [Key]
    public required string Id { get; set; }

    public Guid BookingId { get; set; }
    public BookingCourt? Booking { get; set; }

    public DateTime PaymentCreatedAt { get; set; } = DateTime.UtcNow;

    public required int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public decimal Amount { get; set; }
    public string Status { get; set; } = PaymentStatus.PendingPayment;
    public string? Note { get; set; }
}
