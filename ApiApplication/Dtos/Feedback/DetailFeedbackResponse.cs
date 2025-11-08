namespace ApiApplication.Dtos.Feedback;

public class DetailFeedbackResponse
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public Guid BookingCourtOccurrenceId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public int CourtQuality { get; set; }
    public int StaffService { get; set; }
    public int Cleanliness { get; set; }
    public int Lighting { get; set; }
    public int ValueForMoney { get; set; }
    public string[]? MediaUrl { get; set; }
    public string? AdminReply { get; set; }
    public DateTime? AdminReplyAt { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
}
