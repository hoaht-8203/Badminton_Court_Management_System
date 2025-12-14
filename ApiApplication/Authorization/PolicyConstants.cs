namespace ApiApplication.Authorization;

/// <summary>
/// Defines authorization policy names for the application
/// </summary>
public static class PolicyConstants
{
    // Admin only policies
    public const string AdminOnly = "AdminOnly";
    
    // Management policies (Admin + Branch Administrator)
    public const string ManagementOnly = "ManagementOnly";
    
    // Staff policies (Admin + Branch Admin + Staff + Receptionist + Warehouse Staff)
    public const string StaffAccess = "StaffAccess";
    
    // Office staff policies (Admin + Branch Admin + Staff + Receptionist)
    public const string OfficeStaffAccess = "OfficeStaffAccess";
    
    // Warehouse policies (Admin + Branch Admin + Warehouse Staff)
    public const string WarehouseAccess = "WarehouseAccess";
    
    // Receptionist policies (Admin + Branch Admin + Receptionist)
    public const string ReceptionistAccess = "ReceptionistAccess";
    
    // Customer access (All authenticated users including customers)
    public const string CustomerAccess = "CustomerAccess";
    
    // Any authenticated user
    public const string Authenticated = "Authenticated";
}
