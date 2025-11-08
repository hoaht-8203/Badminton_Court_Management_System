using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Feedback;

public class UpdateFeedbackRequest
{
    [Required]
    public int Id { get; set; }

    [Range(1, 5)]
    public int? Rating { get; set; }
    public string? Comment { get; set; }

    [Range(1, 5)]
    public int? CourtQuality { get; set; }

    [Range(1, 5)]
    public int? StaffService { get; set; }

    [Range(1, 5)]
    public int? Cleanliness { get; set; }

    [Range(1, 5)]
    public int? Lighting { get; set; }

    [Range(1, 5)]
    public int? ValueForMoney { get; set; }
    public string[]? MediaUrl { get; set; }

    // Admin side updates
    public string? AdminReply { get; set; }
}
