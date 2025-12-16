"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Result, Button, Spin } from "antd";
import { canAccessRoute, hasStaffAccess } from "@/utils/rbac";

type Props = {
  children: React.ReactNode;
  requiredRoles?: string[]; // Any of these roles can access
  fallbackPath?: string;
  showForbidden?: boolean; // Show 403 page instead of redirecting
  checkRoutePermissions?: boolean; // Check route permissions based on URL
};

export default function RoleGuard({
  children,
  requiredRoles,
  fallbackPath = "/homepage",
  showForbidden = true,
  checkRoutePermissions = false,
}: Props) {
  const { user, loading, isAuthorized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/quanlysancaulong/login");
      return;
    }

    const userRoles = user.roles || [];

    // Check route permissions if enabled (for URL-based protection)
    if (checkRoutePermissions && pathname.startsWith("/quanlysancaulong")) {
      // First check if user has staff access at all
      if (!hasStaffAccess(userRoles)) {
        console.warn("User does not have staff access, redirecting to forbidden");
        router.replace("/forbidden");
        return;
      }

      // Then check specific route permissions
      if (!canAccessRoute(pathname, userRoles)) {
        console.warn(`User does not have access to route: ${pathname}, redirecting to forbidden`);
        router.replace("/forbidden");
        return;
      }
    }

    // Check component-level role requirements
    if (requiredRoles && !isAuthorized(requiredRoles) && !showForbidden) {
      router.replace(fallbackPath);
    }
  }, [user, loading, requiredRoles, isAuthorized, router, fallbackPath, showForbidden, checkRoutePermissions, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) return null;

  if (requiredRoles && !isAuthorized(requiredRoles)) {
    if (showForbidden) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Result
            status="403"
            title="403"
            subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
            extra={
              <Button type="primary" onClick={() => router.push(fallbackPath)}>
                Quay lại
              </Button>
            }
          />
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
