using System;

namespace ApiApplication.Entities.Shared;

public static class ServiceStatus
{
    public const string Active = "Active";
    public const string Inactive = "Inactive";
    public const string Maintenance = "Maintenance";

    public static readonly string[] ValidStatuses = [Active, Inactive, Maintenance];
}
