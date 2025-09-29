using Minio.DataModel;

namespace ApiApplication.Entities.Shared;

public static class InvoiceStatus
{
    public const string Pending = "Pending";
    public const string Unpaid = "Unpaid";
    public const string Paid = "Paid";
    public const string Cancelled = "Cancelled";

    public static readonly string[] ValidCustomerStatus = [Pending, Unpaid, Paid, Cancelled];
}
