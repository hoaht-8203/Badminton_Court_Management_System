namespace ApiApplication.Entities.Shared;

public static class CashFlowStatus
{
    public const string Paid = "Paid";
    public const string Cancelled = "Cancelled";
    public const string Pending = "Pending";

    public static readonly string[] ValidCashFlowStatus = [Paid, Cancelled, Pending];
}
