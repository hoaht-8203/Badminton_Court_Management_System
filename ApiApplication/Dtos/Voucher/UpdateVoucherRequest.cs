using System;
using System.Collections.Generic;

namespace ApiApplication.Dtos.Voucher;

public class UpdateVoucherRequest
{
    public string Code { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string DiscountType { get; set; } = "fixed";
    public decimal DiscountValue { get; set; } = 0;
    public int? DiscountPercentage { get; set; }
    public decimal? MaxDiscountValue { get; set; }
    public decimal? MinOrderValue { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public int UsageLimitTotal { get; set; } = 0;
    public int UsageLimitPerUser { get; set; } = 1;
    public bool IsActive { get; set; } = true;

    public List<VoucherTimeRuleDto>? TimeRules { get; set; }
    public List<VoucherUserRuleDto>? UserRules { get; set; }
}
