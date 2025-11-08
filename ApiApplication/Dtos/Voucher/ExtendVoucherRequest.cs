using System;

namespace ApiApplication.Dtos.Voucher;

public class ExtendVoucherRequest
{
    public DateTime? EndAt { get; set; }
    public int? UsageLimitTotal { get; set; }
    public int? UsageLimitPerUser { get; set; }
}

