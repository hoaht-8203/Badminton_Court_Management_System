namespace ApiApplication.Dtos.Order;

public class CheckoutResponse
{
    public Guid OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public Guid BookingId { get; set; }
    public Guid BookingCourtOccurrenceId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CourtName { get; set; } = string.Empty;

    // Thông tin thanh toán sân
    public decimal CourtTotalAmount { get; set; }
    public decimal CourtPaidAmount { get; set; }
    public decimal CourtRemainingAmount { get; set; }

    // Thông tin món hàng
    public decimal ItemsSubtotal { get; set; }

    // Thông tin dịch vụ
    public decimal ServicesSubtotal { get; set; }

    // Thông tin phí muộn
    public decimal LateFeePercentage { get; set; }
    public decimal LateFeeAmount { get; set; }
    public int OverdueMinutes { get; set; }
    public string OverdueDisplay { get; set; } = string.Empty;

    // Tổng thanh toán
    public decimal TotalAmount { get; set; }

    // Thông tin thanh toán
    public string PaymentId { get; set; } = string.Empty;
    public decimal PaymentAmount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string QrUrl { get; set; } = string.Empty;
    public int HoldMinutes { get; set; }
    public DateTime ExpiresAtUtc { get; set; }

    // Thời gian
    public DateTime CreatedAt { get; set; }
}
