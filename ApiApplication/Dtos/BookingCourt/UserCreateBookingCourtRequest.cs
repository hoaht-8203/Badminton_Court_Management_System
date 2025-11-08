using System;

namespace ApiApplication.Dtos.BookingCourt;

public class UserCreateBookingCourtRequest
{
    public Guid UserId { get; set; }
    public Guid CourtId { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int[]? DaysOfWeek { get; set; }
    public string? Note { get; set; }

    // Payment preferences
    public bool? PayInFull { get; set; } // default false -> pay deposit

    // Optional voucher applied at booking time by user
    public int? VoucherId { get; set; }
}
