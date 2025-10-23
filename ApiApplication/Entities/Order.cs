using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Order : BaseEntity
{
    [Key]
    public Guid Id { get; set; }

    public string OrderCode { get; set; } = string.Empty;

    public required Guid BookingId { get; set; }

    [ForeignKey(nameof(BookingId))]
    public BookingCourt Booking { get; set; } = null!;

    public Guid? BookingCourtOccurrenceId { get; set; }

    [ForeignKey(nameof(BookingCourtOccurrenceId))]
    public BookingCourtOccurrence? BookingCourtOccurrence { get; set; }

    public required int CustomerId { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public Customer Customer { get; set; } = null!;

    // Thông tin thanh toán sân
    public decimal CourtTotalAmount { get; set; }
    public decimal CourtPaidAmount { get; set; }
    public decimal CourtRemainingAmount { get; set; }

    // Thông tin món hàng
    public decimal ItemsSubtotal { get; set; }

    // Thông tin dịch vụ
    public decimal ServicesSubtotal { get; set; }

    // Thông tin phí muộn
    public decimal LateFeePercentage { get; set; } = 150m; // Default 150%
    public decimal LateFeeAmount { get; set; }
    public int OverdueMinutes { get; set; }

    // Tổng thanh toán
    public decimal TotalAmount { get; set; }

    // Trạng thái đơn hàng
    public string Status { get; set; } = OrderStatus.Pending;

    // Phương thức thanh toán
    public string PaymentMethod { get; set; } = string.Empty;

    // Ghi chú
    public string? Note { get; set; }

    // Navigation properties
    public ICollection<Payment> Payments { get; set; } = [];
}

public static class OrderStatus
{
    public const string Pending = "Pending";
    public const string Paid = "Paid";
    public const string Cancelled = "Cancelled";
    public const string Refunded = "Refunded";
}
