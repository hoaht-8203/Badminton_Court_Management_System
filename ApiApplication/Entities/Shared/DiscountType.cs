using System;

namespace ApiApplication.Entities.Shared;

public static class DiscountType
{
    public const string Percentage = "percentage";
    public const string Fixed = "fixed";
    public const string BuyXGetY = "buy_x_get_y";

    public static readonly string[] ValidTypes = { Percentage, Fixed, BuyXGetY };
}
