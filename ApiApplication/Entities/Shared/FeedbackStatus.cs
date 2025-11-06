using System;

namespace ApiApplication.Entities.Shared;

public static class FeedbackStatus
{
    public const string Active = "Active";
    public const string Inactive = "Inactive";
    public const string Deleted = "Deleted";

    public static readonly string[] ValidStatuses = { Active, Inactive, Deleted };
}
