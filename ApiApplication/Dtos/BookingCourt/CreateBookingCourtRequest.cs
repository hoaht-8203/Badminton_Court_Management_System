namespace ApiApplication.Dtos.BookingCourt;

public class CreateBookingCourtRequest
{
    public int CustomerId { get; set; }
    public Guid CourtId { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int[]? DaysOfWeek { get; set; }
    public string? Note { get; set; }

    // Payment preferences
    public bool? PayInFull { get; set; } // default false -> pay deposit
    public decimal? DepositPercent { get; set; } // default 0.3m if not provided
    public string? PaymentMethod { get; set; } // "Bank" | "Cash"

    public bool? IsUserMode { get; set; } = false;
}
