using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Customer;

public class ChangeCustomerStatusRequest
{
    [Required(ErrorMessage = "ID khách hàng là bắt buộc")]
    public required int Id { get; set; }

    [Required(ErrorMessage = "Trạng thái mới là bắt buộc")]
    public required string Status { get; set; }

    // Helper method để validate status
    public bool IsValidStatus()
    {
        return CustomerStatus.ValidCustomerStatus.Contains(Status);
    }
}
