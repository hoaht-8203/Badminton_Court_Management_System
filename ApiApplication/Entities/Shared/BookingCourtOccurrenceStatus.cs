using System;

namespace ApiApplication.Entities.Shared;

public static class BookingCourtOccurrenceStatus
{
    public const string PendingPayment = "PendingPayment"; // Khi đặt sân thành công nhưng chưa thanh toán
    public const string Active = "Active";
    public const string Cancelled = "Cancelled"; // Khi đặt sân thành công nhưng bị hủy
    public const string Completed = "Completed";
    public const string CheckedIn = "CheckedIn"; // Khách đã đến và nhận sân
    public const string NoShow = "NoShow"; // Khách không đến, mất cọc

    public static readonly string[] ValidCustomerStatus =
    [
        PendingPayment,
        Active,
        Cancelled,
        Completed,
        CheckedIn,
        NoShow,
    ];
}
