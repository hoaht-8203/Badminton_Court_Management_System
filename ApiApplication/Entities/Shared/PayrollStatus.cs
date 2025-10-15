using System;

namespace ApiApplication.Entities.Shared;

public static class PayrollStatus
{
    // đã thanh toán (hoàn thành)
    public const string Completed = "Completed";
    // chưa thanh toán (đang chờ xử lý)
    public const string Pending = "Pending";
    // thanh toán một phần
    public const string PartiallyPaid = "PartiallyPaid";
    // đã hủy
    public const string Canceled = "Canceled";

    public static readonly string[] ValidStatuses = { Completed, Pending, PartiallyPaid, Canceled };
}
