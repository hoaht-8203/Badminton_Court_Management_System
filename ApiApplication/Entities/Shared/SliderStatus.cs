using System;

namespace ApiApplication.Entities.Shared;

public static class SliderStatus
{
    public const string Active = "Active";
    public const string Inactive = "Inactive";
    public const string Deleted = "Deleted";

    public static readonly string[] ValidSliderStatus = [Active, Inactive, Deleted];
}
