using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class BookingCourt : BaseEntity
{
    [Key]
    public Guid Id { get; set; }

    public required int CustomerId { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public Customer? Customer { get; set; }

    public required Guid CourtId { get; set; }

    [ForeignKey(nameof(CourtId))]
    public Court? Court { get; set; }

    public required DateOnly StartDate { get; set; }
    public required DateOnly EndDate { get; set; }

    public required TimeOnly StartTime { get; set; }
    public required TimeOnly EndTime { get; set; }

    // Theo chuẩn CourtPricingRules: mảng các thứ trong tuần (2..8). Vãng lai => để mảng rỗng
    public required int[] DaysOfWeek { get; set; } = [];

    public string? Note { get; set; }
    public string Status { get; set; } = BookingCourtStatus.Active;
}
