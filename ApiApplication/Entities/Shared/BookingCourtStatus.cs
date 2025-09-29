namespace ApiApplication.Entities.Shared;

public static class BookingCourtStatus
{
    public const string Active = "Active";
    public const string Cancelled = "Cancelled";
    public const string Completed = "Completed";

    public static readonly string[] ValidCustomerStatus = [Active, Cancelled, Completed];
}
