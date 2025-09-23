using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Court;

public class DeleteCourtRequest
{
    [Required(ErrorMessage = "ID sân là bắt buộc")]
    public required Guid Id { get; set; }
}
