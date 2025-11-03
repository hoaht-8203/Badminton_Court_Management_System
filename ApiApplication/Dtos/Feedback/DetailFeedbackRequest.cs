using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Feedback;

public class DetailFeedbackRequest
{
    [Required]
    public int Id { get; set; }
}


