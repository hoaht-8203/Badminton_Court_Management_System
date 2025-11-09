using ApiApplication.Dtos.Payment;
using ApiApplication.Dtos.Service;

namespace ApiApplication.Dtos.BookingCourt;

public class DetailBookingCourtResponse
{
    public Guid Id { get; set; }
    public int CustomerId { get; set; }
    public Guid CourtId { get; set; }
    public string? CourtName { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int[]? DaysOfWeek { get; set; }
    public string? Status { get; set; }
    public decimal TotalHours { get; set; }

    // Extra info
    public Customer.CustomerDto Customer { get; set; } = null!;
    public List<PaymentDto> Payments { get; set; } = [];
    public List<BookingServiceDto> BookingServices { get; set; } = [];
    public List<BookingCourtOccurrenceDto> BookingCourtOccurrences { get; set; } = [];

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

    // Membership discount info
    public bool HasMembershipDiscount { get; set; }
    public decimal? MembershipDiscountPercent { get; set; }
    public decimal? MembershipDiscountAmount { get; set; }
    public decimal? OriginalAmount { get; set; } // Amount before discount (court cost only)
    public string? MembershipName { get; set; } // Name of the membership applied
}
