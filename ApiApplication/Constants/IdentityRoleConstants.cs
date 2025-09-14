using System;

namespace ApiApplication.Constants;

public class IdentityRoleConstants
{
    public static readonly Guid AdminRoleGuid = new("5d8d3cc8-4fde-4c21-a70b-deaf8ebe51a2");
    public static readonly Guid UserRoleGuid = new("66dddd1c-bf05-4032-b8a5-6adbf73dc09e");

    public const string Admin = "Admin";
    public const string User = "User";
}
