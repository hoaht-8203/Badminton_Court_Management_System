namespace ApiApplication.Dtos.Voucher;

public class GetAvailableVouchersRequest
{
    /// <summary>
    /// Booking start date and time (optional, defaults to current UTC time)
    /// Used to check time-based voucher rules
    /// </summary>
    public DateTime? BookingDateTime { get; set; }

    /// <summary>
    /// Booking end time (optional)
    /// Used to check time-based voucher rules
    /// </summary>
    public DateTime? EndTime { get; set; }

    /// <summary>
    /// Original booking amount before any discounts (optional)
    /// Used to filter vouchers by MinOrderValue
    /// </summary>
    public decimal? OriginalAmount { get; set; }

    /// <summary>
    /// Customer ID (optional, only used by staff when booking for customers)
    /// If not provided, uses current user's customer ID
    /// Used to check customer-specific voucher rules
    /// </summary>
    public int? CustomerId { get; set; }
}
