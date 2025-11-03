namespace ApiApplication.Dtos.Feedback;

public class ListFeedbackResponse
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public Guid BookingCourtOccurrenceId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
}


