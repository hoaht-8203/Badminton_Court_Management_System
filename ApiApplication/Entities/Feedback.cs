using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Feedback : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public required int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public required Guid BookingCourtOccurrenceId { get; set; }

    public BookingCourtOccurrence BookingCourtOccurrence { get; set; } = null!;

    // Overall rating (1-5)
    [Range(1, 5)]
    public int Rating { get; set; } = 5;

    public string? Comment { get; set; }

    // Sub-ratings (1-5)
    [Range(1, 5)]
    public int CourtQuality { get; set; } = 5;

    [Range(1, 5)]
    public int StaffService { get; set; } = 5;

    [Range(1, 5)]
    public int Cleanliness { get; set; } = 5;

    [Range(1, 5)]
    public int Lighting { get; set; } = 5;

    [Range(1, 5)]
    public int ValueForMoney { get; set; } = 5;

    // Media attachments (images/videos) - up to 3 recommended
    public string[]? MediaUrl { get; set; }

    public string? AdminReply { get; set; }

    public DateTime? AdminReplyAt { get; set; }

    public string Status { get; set; } = FeedbackStatus.Active;
}
