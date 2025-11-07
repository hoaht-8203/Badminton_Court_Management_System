using System;

namespace ApiApplication.Dtos.Voucher;

public class VoucherTimeRuleDto
{
    public DayOfWeek? DayOfWeek { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public DateTime? SpecificDate { get; set; }
}
