using ApiApplication.Entities;

namespace ApiApplication.Dtos.Order;

public class OrderResponse
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CourtName { get; set; } = string.Empty;

    // Thông tin thanh toán sân
    public decimal CourtTotalAmount { get; set; }
    public decimal CourtPaidAmount { get; set; }
    public decimal CourtRemainingAmount { get; set; }

    // Thông tin món hàng
    public decimal ItemsSubtotal { get; set; }

    // Thông tin phí muộn
    public decimal LateFeePercentage { get; set; }
    public decimal LateFeeAmount { get; set; }
    public int OverdueMinutes { get; set; }
    public string OverdueDisplay { get; set; } = string.Empty;

    // Tổng thanh toán
    public decimal TotalAmount { get; set; }

    // Trạng thái
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }

    // Thông tin thanh toán
    public List<PaymentSummary> Payments { get; set; } = [];
    public List<OrderItemSummary> OrderItems { get; set; } = [];

    // Thời gian
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class PaymentSummary
{
    public string Id { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime PaymentCreatedAt { get; set; }
    public string? Note { get; set; }
}

public class OrderItemSummary
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Image { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
}
