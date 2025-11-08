using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Voucher;

public class DetailVoucherRequest
{
    [Required]
    public int Id { get; set; }
}
