using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.Service;

public class RemoveBookingServiceRequest
{
    [Required]
    public required Guid BookingCourtOccurrenceId { get; set; }
}
