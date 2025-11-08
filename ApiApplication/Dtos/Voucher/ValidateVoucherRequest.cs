using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Voucher;

public class ValidateVoucherRequest
{
    [Required]
    public int VoucherId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Tổng tiền đơn hàng phải lớn hơn 0")]
    public decimal OrderTotalAmount { get; set; } // Tổng tiền trước khi giảm giá
}
