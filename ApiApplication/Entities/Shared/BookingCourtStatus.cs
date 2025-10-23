namespace ApiApplication.Entities.Shared;

public static class BookingCourtStatus
{
    public const string PendingPayment = "PendingPayment"; // Khi đặt sân thành công nhưng chưa thanh toán
    public const string Active = "Active";
    public const string Cancelled = "Cancelled"; // Khi đặt sân thành công nhưng bị hủy

    public static readonly string[] ValidCustomerStatus = [PendingPayment, Active, Cancelled];
}
