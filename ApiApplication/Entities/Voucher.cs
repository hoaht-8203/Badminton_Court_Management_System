using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Voucher : BaseEntity
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string DiscountType { get; set; } = null!; // "percentage" | "fixed"
    public decimal DiscountValue { get; set; } = 0;
    public int? DiscountPercentage { get; set; }
    public decimal? MaxDiscountValue { get; set; }
    public decimal? MinOrderValue { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public int UsageLimitTotal { get; set; } = 0;
    public int UsageLimitPerUser { get; set; } = 1;
    public int UsedCount { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public ICollection<VoucherTimeRule>? TimeRules { get; set; }
    public ICollection<VoucherUserRule>? UserRules { get; set; }
}
