using System;

namespace ApiApplication.Entities;

public class VoucherTimeRule
{
    public int Id { get; set; }
    public int VoucherId { get; set; }
    public Voucher Voucher { get; set; } = null!;

    public DayOfWeek? DayOfWeek { get; set; }

    // Khoảng thời gian trong ngày
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }

    // Ngày cụ thể
    public DateTime? SpecificDate { get; set; }
}
