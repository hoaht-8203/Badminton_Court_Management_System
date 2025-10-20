using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Payment;

public class CreatePaymentForOrderRequest
{
    [Required]
    public Guid OrderId { get; set; }

    [Required]
    public Guid BookingId { get; set; }

    [Required]
    public int CustomerId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Số tiền phải lớn hơn 0")]
    public decimal Amount { get; set; }

    [Required]
    public string PaymentMethod { get; set; } = "Bank"; // "Cash" hoặc "Bank"

    public string? Note { get; set; }
}
