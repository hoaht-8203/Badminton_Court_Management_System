"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Result, Button, Spin } from "antd";

type Props = {
  children: React.ReactNode;
  requiredRoles?: string[]; // Any of these roles can access
  fallbackPath?: string;
  showForbidden?: boolean; // Show 403 page instead of redirecting
};

export default function RoleGuard({ children, requiredRoles, fallbackPath = "/homepage", showForbidden = true }: Props) {
  const { user, loading, isAuthorized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/quanlysancaulong/login");
      return;
    }

    if (requiredRoles && !isAuthorized(requiredRoles) && !showForbidden) {
      router.replace(fallbackPath);
    }
  }, [user, loading, requiredRoles, isAuthorized, router, fallbackPath, showForbidden]);

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
