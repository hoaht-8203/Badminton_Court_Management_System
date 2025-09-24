using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Customer;

public class ChangeCourtStatusRequest
{
    [Required(ErrorMessage = "ID sân là bắt buộc")]
    public required Guid Id { get; set; }

    [Required(ErrorMessage = "Trạng thái mới là bắt buộc")]
    public required string Status { get; set; }

    // Helper method để validate status
    public bool IsValidStatus()
    {
        return CourtStatus.ValidCustomerStatus.Contains(Status);
    }
}
