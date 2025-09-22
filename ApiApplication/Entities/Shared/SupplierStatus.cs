using System;

namespace ApiApplication.Entities.Shared;

public class SupplierStatus
{
    public const string Active = "Active";
    public const string Inactive = "Inactive";
    public const string Deleted = "Deleted";

    public static readonly string[] ValidSupplierStatus = [Active, Inactive, Deleted];
}
