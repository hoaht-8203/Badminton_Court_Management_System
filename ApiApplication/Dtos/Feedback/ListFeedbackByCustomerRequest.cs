using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Feedback;

public class ListFeedbackByCustomerRequest
{
    [Required]
    public int CustomerId { get; set; }
}
