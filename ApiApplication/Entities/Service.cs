using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Service : BaseEntity
{
    [Key]
    public required Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Code { get; set; }

    [Required]
    [MaxLength(255)]
    public required string Name { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [Required]
    public required string Status { get; set; } = ServiceStatus.Active;

    [Required]
    public required decimal PricePerHour { get; set; }

    [MaxLength(50)]
    public string? Category { get; set; } // e.g., "Equipment", "Referee", "Clothing"

    [MaxLength(100)]
    public string? Unit { get; set; } // e.g., "per racket", "per person", "per set"

    public int? StockQuantity { get; set; } // Available quantity for rental

    [MaxLength(1000)]
    public string? Note { get; set; }

    // Navigation properties
    public ICollection<BookingService> BookingServices { get; set; } = [];
}
