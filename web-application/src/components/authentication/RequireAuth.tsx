"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

type Props = {
  children: React.ReactNode;
  roles?: string[];
  fallback?: React.ReactNode;
};

const RequireAuth = ({ children, roles, fallback }: Props) => {
  const { user, loading, isAuthorized } = useAuth();

  if (loading) return null;
  if (!user) return <>{fallback ?? null}</>;
  if (!isAuthorized(roles)) return <>{fallback ?? null}</>;
  return <>{children}</>;
};

export default RequireAuth;
