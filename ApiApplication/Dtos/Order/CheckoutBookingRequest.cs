using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Order;

public class CheckoutBookingRequest
{
    [Required]
    public Guid BookingCourtOccurrenceId { get; set; }

    [Range(0, 1000, ErrorMessage = "Phần trăm phí muộn phải từ 0 đến 1000")]
    public decimal LateFeePercentage { get; set; } = 150m;

    [Required]
    public string PaymentMethod { get; set; } = "Bank"; // "Cash" hoặc "Bank"

    public string? Note { get; set; }
}
