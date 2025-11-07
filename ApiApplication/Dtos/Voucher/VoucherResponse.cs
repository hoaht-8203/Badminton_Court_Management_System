using System;
using System.Collections.Generic;

namespace ApiApplication.Dtos.Voucher;

public class VoucherResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string DiscountType { get; set; } = null!;
    public decimal DiscountValue { get; set; }
    public int? DiscountPercentage { get; set; }
    public decimal? MaxDiscountValue { get; set; }
    public decimal? MinOrderValue { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public int UsageLimitTotal { get; set; }
    public int UsageLimitPerUser { get; set; }
    public int UsedCount { get; set; }
    public bool IsActive { get; set; }

    public List<VoucherTimeRuleDto>? TimeRules { get; set; }
    public List<VoucherUserRuleDto>? UserRules { get; set; }
}
