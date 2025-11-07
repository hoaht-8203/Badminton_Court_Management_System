using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Voucher;

public class DeleteVoucherRequest
{
    [Required]
    public int Id { get; set; }
}

