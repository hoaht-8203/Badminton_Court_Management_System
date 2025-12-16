import { ROLES, hasAnyRole } from "@/constants/roles";
import type { MenuProps } from "antd";

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

export type RouteConfig = {
  path: string;
  requiredRoles: string[];
  children?: RouteConfig[];
};

export const filterMenuByRoles = (menuItems: MenuItemType[], userRoles: string[]): MenuProps["items"] => {
  return menuItems
    .filter((item) => {
      if (!item) return false;
      if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
      return hasAnyRole(userRoles, item.requiredRoles);
    })
    .map((item) => {
      if (!item) return null;

      const { requiredRoles, ...itemWithoutRoles } = item;

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

export const hasStaffAccess = (userRoles: string[]): boolean => {
  const staffRoles = [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR, ROLES.STAFF, ROLES.WAREHOUSE_STAFF, ROLES.RECEPTIONIST];
  return hasAnyRole(userRoles, staffRoles);
};

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

export const canAccessRoute = (pathname: string, userRoles: string[]): boolean => {
  const route = ROUTE_PERMISSIONS.find((r) => {
    return pathname === r.path || pathname.startsWith(r.path + "/");
  });

  if (!route) return true;

  return hasAnyRole(userRoles, route.requiredRoles);
};

export const getDefaultRouteForUser = (userRoles: string[]): string => {
  if (!hasStaffAccess(userRoles)) {
    return "/";
  }

  for (const route of ROUTE_PERMISSIONS) {
    if (hasAnyRole(userRoles, route.requiredRoles)) {
      return route.path;
    }
  }

  return "/quanlysancaulong/dashboard";
};
