using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Order;

public class CreateOrderRequest
{
    [Required]
    public Guid BookingId { get; set; }

    [Range(0, 1000, ErrorMessage = "Phần trăm phí muộn phải từ 0 đến 1000")]
    public decimal LateFeePercentage { get; set; } = 150m;

    public string? Note { get; set; }
}
