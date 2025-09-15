"use client";

import { useAuth } from "@/context/AuthContext";
import React from "react";

const DashboardPage = () => {
  const { user } = useAuth();
  return (
    <div>Welcome to the dashboard - Welcome username: {user?.userName}</div>
  );
};

export default DashboardPage;
