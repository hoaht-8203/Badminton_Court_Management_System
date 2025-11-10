using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Voucher;

public class ValidateVoucherRequest
{
    [Required]
    public int VoucherId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Tổng tiền đơn hàng phải lớn hơn 0")]
    public decimal OrderTotalAmount { get; set; } // Tổng tiền trước khi giảm giá

    // Optional - booking time context. If provided, voucher time rules and date-range checks
    // will be evaluated against these values instead of the current DateTime.UtcNow.
    public DateTime? BookingDate { get; set; }
    public TimeOnly? BookingStartTime { get; set; }
    public TimeOnly? BookingEndTime { get; set; }
    
    // Optional - allow staff (receptionist/admin) to validate a voucher for a specific customer
    // when they are booking on behalf of that customer. If not provided, controller will
    // resolve customer via current user.
    public int? CustomerId { get; set; }
}
