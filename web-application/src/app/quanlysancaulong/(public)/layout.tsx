"use client";

import React from "react";

import RequireAuth from "@/components/authentication/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { CurrentUserResponse } from "@/types-openapi/api";
import { LogoutOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Dropdown, Layout } from "antd";
import { Content } from "antd/es/layout/layout";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";

const userMenuItems = (user: CurrentUserResponse, router: AppRouterInstance, logout: () => void): MenuProps["items"] => {
  const isAdmin = user.roles?.includes("Admin");

  if (isAdmin) {
    return [
      {
        key: "1",
        label: user.fullName || user.userName || "",
        onClick: () => {
          router.push("/quanlysancaulong/users/profile");
        },
      },
      {
        type: "divider",
      },
      {
        key: "2",
        label: "Thông tin cá nhân",
        icon: <UserOutlined />,
        onClick: () => {
          router.push("/quanlysancaulong/users/profile");
        },
      },
      {
        key: "3",
        label: "Quản lý hệ thống",
        icon: <SettingOutlined />,
        onClick: () => {
          router.push("/quanlysancaulong/dashboard");
        },
      },
      {
        key: "4",
        label: "Đăng xuất",
        icon: <LogoutOutlined />,
        onClick: () => {
          logout();
        },
      },
    ];
  }

  return [
    {
      key: "1",
      label: user.fullName || user.userName || "",
      disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "2",
      label: "Thông tin cá nhân",
      icon: <UserOutlined />,
      onClick: () => {
        router.push("/quanlysancaulong/users/profile");
      },
    },
    {
      key: "4",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: () => {
        logout();
      },
    },
  ];
};

const { Header } = Layout;

const ComponentLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <RequireAuth fallback={null}>
      <Layout className="h-screen">
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            paddingLeft: "16px",
            justifyContent: "space-between",
            backgroundColor: "white",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <div className="text-xl font-bold text-black">Caulong365</div>
          <div>
            <Dropdown
              menu={{
                items: userMenuItems(user || ({} as CurrentUserResponse), router, logout),
              }}
              placement="bottomLeft"
              arrow
              trigger={["click"]}
            >
              <Avatar style={{ backgroundColor: "#87d068" }} icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Header>
        <Content style={{ padding: "0 48px", backgroundColor: "white" }}>{children}</Content>
      </Layout>
    </RequireAuth>
  );
};

export default ComponentLayout;
