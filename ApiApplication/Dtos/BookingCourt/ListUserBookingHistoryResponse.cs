using System;
using ApiApplication.Dtos.Customer;
using ApiApplication.Dtos.Payment;

namespace ApiApplication.Dtos.BookingCourt;

public class ListUserBookingHistoryResponse
{
    public Guid Id { get; set; }
    public string? PaymentId { get; set; }
    public int CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public Guid CourtId { get; set; }
    public string? CourtName { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int[]? DaysOfWeek { get; set; }
    public string? Status { get; set; }
    public decimal TotalHours { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public List<BookingCourtOccurrenceDto> BookingCourtOccurrences { get; set; } = [];
    public List<PaymentDto> Payments { get; set; } = [];
    public CustomerDto Customer { get; set; } = null!;
}
