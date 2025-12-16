import { ROLES, hasAnyRole } from "@/constants/roles";
import type { MenuProps } from "antd";

/**
 * Menu item type with role requirements
 */
export type MenuItemType = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  requiredRoles?: string[];
  children?: MenuItemType[];
  type?: "divider";
  disabled?: boolean;
  onClick?: () => void;
};

/**
 * Route configuration with role requirements
 */
export type RouteConfig = {
  path: string;
  requiredRoles: string[];
  children?: RouteConfig[];
};

/**
 * Filter menu items based on user roles
 * @param menuItems - Array of menu items to filter
 * @param userRoles - Array of user's roles
 * @returns Filtered menu items that user has access to
 */
export const filterMenuByRoles = (menuItems: MenuItemType[], userRoles: string[]): MenuProps["items"] => {
  return menuItems
    .filter((item) => {
      if (!item) return false;
      // If no roles specified, show to everyone
      if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
      // Check if user has any of the required roles
      return hasAnyRole(userRoles, item.requiredRoles);
    })
    .map((item) => {
      if (!item) return null;

      // Remove requiredRoles from the item to avoid React warning
      const { requiredRoles, ...itemWithoutRoles } = item;

      // If item has children, filter them too
      if (itemWithoutRoles.children) {
        const filteredChildren = item.children
          ?.filter((child: MenuItemType) => {
            if (!child) return false;
            if (!child.requiredRoles || child.requiredRoles.length === 0) return true;
            return hasAnyRole(userRoles, child.requiredRoles);
          })
          .map((child: MenuItemType) => {
            if (!child) return null;
            const { requiredRoles: childRoles, ...childWithoutRoles } = child;
            return childWithoutRoles;
          })
          .filter((child: MenuItemType | null) => child !== null);

        // Only show parent if it has visible children
        if (!filteredChildren || filteredChildren.length === 0) return null;

        return {
          ...itemWithoutRoles,
          children: filteredChildren,
        };
      }

      return itemWithoutRoles;
    })
    .filter((item) => item !== null) as MenuProps["items"];
};

/**
 * Check if user has staff access (any role except Customer/User)
 * @param userRoles - Array of user's roles
 * @returns true if user has staff access
 */
export const hasStaffAccess = (userRoles: string[]): boolean => {
  const staffRoles = [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR, ROLES.STAFF, ROLES.WAREHOUSE_STAFF, ROLES.RECEPTIONIST];
  return hasAnyRole(userRoles, staffRoles);
};

/**
 * Route configurations mapping paths to required roles
 * This is used to protect routes from direct URL access
 */
export const ROUTE_PERMISSIONS: RouteConfig[] = [
  {
    path: "/quanlysancaulong/dashboard",
    requiredRoles: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/quanlydanhmuc",
    requiredRoles: [ROLES.WAREHOUSE_STAFF],
  },
  {
    path: "/quanlysancaulong/thietlapgia",
    requiredRoles: [ROLES.WAREHOUSE_STAFF],
  },
  {
    path: "/quanlysancaulong/inventory",
    requiredRoles: [ROLES.WAREHOUSE_STAFF],
  },
  {
    path: "/quanlysancaulong/stock-in",
    requiredRoles: [ROLES.WAREHOUSE_STAFF],
  },
  {
    path: "/quanlysancaulong/stock-out",
    requiredRoles: [ROLES.WAREHOUSE_STAFF],
  },
  {
    path: "/quanlysancaulong/stock-return",
    requiredRoles: [ROLES.WAREHOUSE_STAFF],
  },
  {
    path: "/quanlysancaulong/court-schedule",
    requiredRoles: [ROLES.RECEPTIONIST],
  },
  {
    path: "/quanlysancaulong/courts",
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/services",
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/orders",
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR, ROLES.RECEPTIONIST],
  },
  {
    path: "/quanlysancaulong/customers",
    requiredRoles: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR, ROLES.STAFF, ROLES.RECEPTIONIST],
  },
  {
    path: "/quanlysancaulong/memberships",
    requiredRoles: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR, ROLES.STAFF, ROLES.RECEPTIONIST],
  },
  {
    path: "/quanlysancaulong/suppliers",
    requiredRoles: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/list-staff",
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/shift",
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/work-schedule",
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/salary",
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/employee-configuration",
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/users",
    requiredRoles: [ROLES.ADMIN],
  },
  {
    path: "/quanlysancaulong/roles",
    requiredRoles: [ROLES.ADMIN],
  },
  {
    path: "/quanlysancaulong/feedbacks",
    requiredRoles: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/blogs",
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/sliders",
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/vouchers",
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/cashflow",
    requiredRoles: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    path: "/quanlysancaulong/cashier",
    requiredRoles: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR, ROLES.STAFF, ROLES.WAREHOUSE_STAFF, ROLES.RECEPTIONIST],
  },
];

/**
 * Check if user has access to a specific route
 * @param pathname - The route path to check
 * @param userRoles - Array of user's roles
 * @returns true if user has access to the route
 */
export const canAccessRoute = (pathname: string, userRoles: string[]): boolean => {
  // Find route configuration
  const route = ROUTE_PERMISSIONS.find((r) => {
    // Exact match or starts with (for dynamic routes)
    return pathname === r.path || pathname.startsWith(r.path + "/");
  });

  // If route not found in permissions, allow access (public route)
  if (!route) return true;

  // Check if user has required roles
  return hasAnyRole(userRoles, route.requiredRoles);
};

/**
 * Get the first accessible route for a user based on their roles
 * Useful for redirecting after login
 * @param userRoles - Array of user's roles
 * @returns The first route path the user has access to
 */
export const getDefaultRouteForUser = (userRoles: string[]): string => {
  // Check if user has staff access
  if (!hasStaffAccess(userRoles)) {
    return "/"; // Redirect to home for non-staff users
  }

  // Find first accessible route
  for (const route of ROUTE_PERMISSIONS) {
    if (hasAnyRole(userRoles, route.requiredRoles)) {
      return route.path;
    }
  }

  // Default fallback
  return "/quanlysancaulong/dashboard";
};
