using System;

namespace ApiApplication.Entities;

public class VoucherUsage
{
    public int Id { get; set; }
    public int VoucherId { get; set; }
    public Voucher Voucher { get; set; } = null!;
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public DateTime UsedAt { get; set; } = DateTime.UtcNow;
    public decimal DiscountApplied { get; set; } = 0;
}
