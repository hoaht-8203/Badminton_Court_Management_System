using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Feedback;

public class DeleteFeedbackRequest
{
    [Required]
    public int Id { get; set; }
}
