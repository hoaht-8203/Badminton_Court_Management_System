using System;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Invoice : BaseEntity
{
    [Key]
    public required string Id { get; set; }

    public Guid BookingId { get; set; }
    public BookingCourt? Booking { get; set; }

    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;

    public decimal Amount { get; set; }
    public string Status { get; set; } = InvoiceStatus.Pending;
    public string? Note { get; set; }
}
