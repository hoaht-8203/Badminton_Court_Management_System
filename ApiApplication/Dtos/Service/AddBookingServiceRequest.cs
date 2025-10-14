using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Service;

public class AddBookingServiceRequest
{
    [Required]
    public required Guid BookingId { get; set; }

    [Required]
    public required Guid ServiceId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
    public required int Quantity { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}
