export const ROLES = {
  ADMIN: "Admin",
  BRANCH_ADMINISTRATOR: "BranchAdministrator",
  STAFF: "Staff",
  WAREHOUSE_STAFF: "WarehouseStaff",
  RECEPTIONIST: "Receptionist",
  CUSTOMER: "Customer",
  // Legacy support
  USER: "User",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Role groups matching backend policies
export const ROLE_GROUPS = {
  // AdminOnly
  ADMIN_ONLY: [ROLES.ADMIN],

  // ManagementOnly
  MANAGEMENT_ONLY: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR],

  // StaffAccess (all staff including management)
  STAFF_ACCESS: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR, ROLES.STAFF, ROLES.WAREHOUSE_STAFF, ROLES.RECEPTIONIST],

  // OfficeStaffAccess
  OFFICE_STAFF_ACCESS: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR, ROLES.STAFF, ROLES.RECEPTIONIST],

  // WarehouseAccess
  WAREHOUSE_ACCESS: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR, ROLES.WAREHOUSE_STAFF],

  // ReceptionistAccess
  RECEPTIONIST_ACCESS: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR, ROLES.RECEPTIONIST],

  // CustomerAccess
  CUSTOMER_ACCESS: [ROLES.CUSTOMER, ROLES.USER],
} as const;

// Helper function to check if user has any of the required roles
export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  if (!requiredRoles || requiredRoles.length === 0) return true;
  return requiredRoles.some((role) => userRoles.includes(role));
}
