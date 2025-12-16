"use client";

import React from "react";

import { useAuth } from "@/context/AuthContext";
import { CurrentUserResponse } from "@/types-openapi/api";
import { LoginOutlined, LogoutOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Dropdown, Layout, Image } from "antd";
import { Content } from "antd/es/layout/layout";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { filterMenuByRoles, type MenuItemType } from "@/utils/rbac";
import { ROLES } from "@/constants/roles";

// User menu items with role requirements
const allUserMenuItems = (user: CurrentUserResponse, router: AppRouterInstance, logout: () => void): MenuItemType[] => {
  return [
    {
      key: "user-name",
      label: user.fullName || user.userName || "",
      disabled: true,
    },
    {
      key: "profile",
      label: "Thông tin cá nhân",
      icon: <UserOutlined />,
      onClick: () => router.push("/homepage/profile"),
    },
    {
      key: "admin-panel",
      label: "Quản lý sân cầu lông",
      icon: <SettingOutlined />,
      requiredRoles: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR],
      onClick: () => router.push("/quanlysancaulong/dashboard"),
    },
    {
      key: "receptionist-panel",
      label: "Nghiệp vụ lễ tân",
      icon: <SettingOutlined />,
      requiredRoles: [ROLES.RECEPTIONIST],
      onClick: () => router.push("/quanlysancaulong/court-schedule"),
    },
    {
      key: "warehouse-panel",
      label: "Nghiệp vụ kiểm kho",
      icon: <SettingOutlined />,
      requiredRoles: [ROLES.WAREHOUSE_STAFF],
      onClick: () => router.push("/quanlysancaulong/inventory"),
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: () => logout(),
    },
  ];
};

const userMenuItems = (user: CurrentUserResponse, router: AppRouterInstance, logout: () => void): MenuProps["items"] => {
  const userRoles = user.roles || [];
  const allItems = allUserMenuItems(user, router, logout);
  const filteredItems = filterMenuByRoles(allItems, userRoles);

  // Add dividers between sections
  const itemsWithDividers: MenuProps["items"] = [];
  filteredItems?.forEach((item, index) => {
    if (index === 1 || (index > 1 && index === filteredItems.length - 1)) {
      itemsWithDividers.push({ type: "divider" });
    }
    itemsWithDividers.push(item);
  });

  return itemsWithDividers;
};

const { Header } = Layout;

const ComponentLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
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
        <div className="container mx-auto flex w-full items-center justify-between gap-2">
          <div className="cursor-pointe flex" onClick={() => router.push("/homepage")} style={{ cursor: "pointer" }}>
            <Image src="/web-logo/caulong365_ver3.png" alt="Caulong365" preview={false} style={{ width: "100%", height: "50px" }} />
          </div>
          <div>
            {user ? (
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
            ) : (
              <Link href="/homepage/login">
                <Button type="primary" icon={<LoginOutlined />}>
                  Đăng nhập
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Header>
      <Content style={{ backgroundColor: "white" }}>{children}</Content>
    </Layout>
  );
};

export default ComponentLayout;
