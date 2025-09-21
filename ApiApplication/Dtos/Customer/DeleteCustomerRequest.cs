using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Customer;

public class DeleteCustomerRequest
{
    [Required(ErrorMessage = "ID khách hàng là bắt buộc")]
    public required int Id { get; set; }
}
