using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Order : BaseEntity
{
    [Key]
    public Guid Id { get; set; }

    public required Guid BookingId { get; set; }

    [ForeignKey(nameof(BookingId))]
    public BookingCourt Booking { get; set; } = null!;

    public required int CustomerId { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public Customer Customer { get; set; } = null!;

    // Thông tin thanh toán sân
    public decimal CourtTotalAmount { get; set; }
    public decimal CourtPaidAmount { get; set; }
    public decimal CourtRemainingAmount { get; set; }

    // Thông tin món hàng
    public decimal ItemsSubtotal { get; set; }

    // Thông tin phí muộn
    public decimal LateFeePercentage { get; set; } = 150m; // Default 150%
    public decimal LateFeeAmount { get; set; }
    public int OverdueMinutes { get; set; }

    // Tổng thanh toán
    public decimal TotalAmount { get; set; }

    // Trạng thái đơn hàng
    public string Status { get; set; } = OrderStatus.Pending;

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
