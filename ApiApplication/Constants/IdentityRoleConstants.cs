using System;

namespace ApiApplication.Constants;

public class IdentityRoleConstants
{
    // Role GUIDs
    public static readonly Guid AdminRoleGuid = new("5d8d3cc8-4fde-4c21-a70b-deaf8ebe51a2");
    public static readonly Guid BranchAdministratorRoleGuid = new("2a1c4e8f-9b3d-4f6e-a7c2-8d5e1f3b9a4c");
    public static readonly Guid StaffRoleGuid = new("3b2d5f9a-1c4e-5a7f-b8d3-9e6f2a4c1b5d");
    public static readonly Guid WarehouseStaffRoleGuid = new("4c3e6a1b-2d5f-6b8a-c9e4-1f7a3b5d2c6e");
    public static readonly Guid ReceptionistRoleGuid = new("5d4f7b2c-3e6a-7c9b-d1f5-2a8b4c6e3d7f");
    public static readonly Guid CustomerRoleGuid = new("66dddd1c-bf05-4032-b8a5-6adbf73dc09e");

    // Role Names
    public const string Admin = "Admin";
    public const string BranchAdministrator = "BranchAdministrator";
    public const string Staff = "Staff";
    public const string WarehouseStaff = "WarehouseStaff";
    public const string Receptionist = "Receptionist";
    public const string Customer = "Customer";
    
    // Legacy - for backward compatibility
    public static readonly Guid UserRoleGuid = CustomerRoleGuid;
    public const string User = Customer;
}
