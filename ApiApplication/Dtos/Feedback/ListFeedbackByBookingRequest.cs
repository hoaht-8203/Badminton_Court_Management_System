using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Feedback;

public class ListFeedbackByBookingRequest
{
    [Required]
    public Guid BookingCourtOccurrenceId { get; set; }
}
