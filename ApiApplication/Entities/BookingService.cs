using System;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Constants;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class BookingService : BaseEntity
{
    [Key]
    public required Guid Id { get; set; }

    [Required]
    public required Guid BookingCourtOccurrenceId { get; set; }
    public required BookingCourtOccurrence BookingCourtOccurrence { get; set; } = null!;

    [Required]
    public required Guid ServiceId { get; set; }
    public required Service Service { get; set; } = null!;

    [Required]
    public required int Quantity { get; set; } = 1;

    [Required]
    public required decimal UnitPrice { get; set; } // Price per hour at time of booking

    [Required]
    public required decimal TotalPrice { get; set; } // Quantity * UnitPrice * Hours

    [Required]
    public required decimal Hours { get; set; } // Duration of service rental

    [MaxLength(500)]
    public string? Notes { get; set; } // Special instructions or notes

    [Required]
    public required string Status { get; set; } = BookingServiceStatus.Pending; // Pending, Confirmed, Cancelled
}
