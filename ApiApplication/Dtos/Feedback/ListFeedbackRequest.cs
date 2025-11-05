namespace ApiApplication.Dtos.Feedback;

public class ListFeedbackRequest
{
    public int? Id { get; set; }
    public int? CustomerId { get; set; }
    public Guid? BookingCourtOccurrenceId { get; set; }
    public int? Rating { get; set; }
    public string? Status { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}


