using System;

namespace ApiApplication.Entities.Shared;

public static class CourtStatus
{
    public const string Active = "Active";
    public const string Inactive = "Inactive";
    public const string Deleted = "Deleted";
    public const string Maintenance = "Maintenance";

    public static readonly string[] ValidCustomerStatus = [Active, Inactive, Deleted, Maintenance];
}
