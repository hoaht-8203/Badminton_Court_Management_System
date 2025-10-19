using System;

namespace ApiApplication.Entities.Shared;

public static class RelatedPeopleGroup
{
    public const string Customer = "Customer";
    public const string Supplier = "Supplier";
    public const string Employee = "Employee";
    public const string Other = "Other";

    public static readonly string[] AllGroups = new[] { Customer, Supplier, Employee, Other };
}
