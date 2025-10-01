namespace ApiApplication.Entities.Shared;

public static class PaymentStatus
{
    public const string PendingPayment = "PendingPayment";
    public const string Unpaid = "Unpaid";
    public const string Paid = "Paid";
    public const string Cancelled = "Cancelled";

    public static readonly string[] ValidCustomerStatus = [PendingPayment, Unpaid, Paid, Cancelled];
}
