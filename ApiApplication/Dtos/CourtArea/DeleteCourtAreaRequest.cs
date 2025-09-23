using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.CourtArea;

public class DeletCourtAreaRequest
{
    [Required(ErrorMessage = "ID địa chỉ sân là bắt buộc")]
    public required int Id { get; set; }
}
