using ApiApplication.Dtos.Payment;
using ApiApplication.Dtos.Service;

namespace ApiApplication.Dtos.BookingCourt;

public class DetailBookingCourtOccurrenceResponse
{
    public Guid Id { get; set; }
    public Guid BookingCourtId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string Status { get; set; } = null!;
    public string? Note { get; set; }
    public decimal TotalHours { get; set; }

    // Extra info
    public Customer.CustomerDto Customer { get; set; } = null!;
    public List<PaymentDto> Payments { get; set; } = [];
    public List<BookingServiceDto> BookingServices { get; set; } = [];
    public List<BookingOrderItemResponse> BookingOrderItems { get; set; } = [];

    // Payment summary
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public string? PaymentType { get; set; } // Deposit | Full | None

    // Inline QR/payment info for quick checkout (when transfer method)
    public string? PaymentId { get; set; }
    public decimal? PaymentAmount { get; set; }
    public string? QrUrl { get; set; }
    public int? HoldMinutes { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }

    // Late info (for cashier UI)
    public int OverdueMinutes { get; set; }
    public decimal OverdueHours { get; set; }
    public decimal SurchargeAmount { get; set; }
    public decimal LateFeePercentage { get; set; } = 150m; // Default 150%
}
