using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Feedback;

public class CreateFeedbackRequest
{
    [Required]
    public int CustomerId { get; set; }

    [Required]
    public Guid BookingCourtOccurrenceId { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; } = 5;

    public string? Comment { get; set; }

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

    public string[]? MediaUrl { get; set; }
}


