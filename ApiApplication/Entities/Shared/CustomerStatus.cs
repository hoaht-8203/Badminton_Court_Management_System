using System;

namespace ApiApplication.Entities.Shared;

public class CustomerStatus
{
    public const string Active = "Active";
    public const string Inactive = "Inactive";
    public const string Deleted = "Deleted";

    public static readonly string[] ValidCustomerStatus = [Active, Inactive, Deleted];
}
