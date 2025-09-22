"use client";

import React from "react";

import { useAuth } from "@/context/AuthContext";
import { CurrentUserResponse } from "@/types-openapi/api";
import { InfoCircleOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Dropdown, Layout, Menu } from "antd";
import { ArrowLeftRight, ChartSpline, Columns2, Handshake, IdCardLanyard, Package, Settings } from "lucide-react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname, useRouter } from "next/navigation";
import RequireAuth from "@/components/authentication/RequireAuth";

const sideBarItems: MenuProps["items"] = [
  {
    key: "/quanlysancaulong/dashboard",
    label: "Tổng quan",
    icon: <ChartSpline className="h-4 w-4" />,
  },
  {
    key: "quanlyhanghoa",
    label: "Quản lý hàng hoá",
    icon: <Package className="h-4 w-4" />,
    children: [
      {
        key: "quanlydanhmuc",
        label: "Quản lý danh mục",
      },
      {
        key: "thietlapgia",
        label: "Thiết lập giá",
      },
      {
        key: "quanlykho",
        label: "Quản lý kho",
      },
    ],
  },
  {
    key: "quanlysancaulong",
    label: "Quản lý sân cầu lông",
    icon: <Columns2 className="h-4 w-4" />,
  },
  {
    key: "quanlygiaodich",
    label: "Quản lý giao dịch",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    children: [
      {
        key: "quanlyhoadon",
        label: "Quản lý hoá đơn",
      },
      {
        key: "trahang",
        label: "Trả hàng",
      },
      {
        key: "nhaphang",
        label: "Nhập hàng",
      },
      {
        key: "trahangnhap",
        label: "Trả hàng nhập",
      },
      {
        key: "xuathuy",
        label: "Xuất huỷ",
      },
    ],
  },
  {
    key: "quanlydoitac",
    label: "Quản lý đối tác",
    icon: <Handshake className="h-4 w-4" />,
    children: [
      {
        key: "/quanlysancaulong/customers",
        label: "Quản lý khách hàng",
      },
      {
        key: "quanlynhacungcap",
        label: "Quản lý nhà cung cấp",
      },
    ],
  },
  {
    key: "quanlynhanvien",
    label: "Quản lý nhân viên",
    icon: <IdCardLanyard className="h-4 w-4" />,
  },
  {
    key: "quantriungdung",
    label: "Quản trị ứng dụng",
    icon: <Settings className="h-4 w-4" />,
    children: [
      {
        key: "/quanlysancaulong/users",
        label: "Quản lý người dùng",
      },
      {
        key: "/quanlysancaulong/roles",
        label: "Quản lý vai trò",
      },
    ],
  },
  {
    key: "quanlythongtin",
    label: "Quản lý thông tin",
    icon: <InfoCircleOutlined />,
    children: [
      {
        key: "/quanlysancaulong/users/profile",
        label: "Quản lý thông tin cá nhân",
      },
    ],
  },
];

const userMenuItems = (user: CurrentUserResponse, router: AppRouterInstance, logout: () => void): MenuProps["items"] => [
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
    key: "3",
    label: "Đăng xuất",
    icon: <LogoutOutlined />,
    onClick: () => {
      logout();
    },
  },
];

const { Header, Sider } = Layout;

const ComponentLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const findParentKeyByPath = React.useCallback((path: string): string | undefined => {
    const parent = (sideBarItems || []).find((item) => item && "children" in item && item.children?.some((child) => String(child?.key) === path));
    return parent?.key ? String(parent.key) : undefined;
  }, []);

  const [selectedKeys, setSelectedKeys] = React.useState<string[]>([pathname]);
  const [openKeys, setOpenKeys] = React.useState<string[]>(
    (() => {
      const parent = findParentKeyByPath(pathname);
      return parent ? [parent] : [];
    })(),
  );

  React.useEffect(() => {
    setSelectedKeys([pathname]);
    const parent = findParentKeyByPath(pathname);
    setOpenKeys(parent ? [parent] : []);
  }, [pathname, findParentKeyByPath]);

  const rootSubmenuKeys = React.useMemo<string[]>(() => {
    return (sideBarItems || [])
      .filter((item) => item && "children" in item && item.children && item.children.length)
      .map((item) => String(item?.key));
  }, []);

  const handleOpenChange = (keys: string[]) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    if (latestOpenKey && rootSubmenuKeys.includes(latestOpenKey)) {
      setOpenKeys([latestOpenKey]);
    } else {
      setOpenKeys(keys);
    }
  };

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
          <div className="text-xl font-bold text-black">Hệ thống quản lý sân cầu lông</div>
          <div>
            <Dropdown
              menu={{
                items: userMenuItems(user || ({} as CurrentUserResponse), router, logout),
              }}
              placement="bottomLeft"
              arrow
            >
              <Avatar style={{ backgroundColor: "#87d068" }} icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Header>
        <Layout>
          <Sider width={250}>
            <Menu
              mode="inline"
              selectedKeys={selectedKeys}
              openKeys={openKeys}
              onOpenChange={(keys) => handleOpenChange(keys as string[])}
              onClick={(info) => {
                const key = info.key as string;
                setSelectedKeys([key]);
                router.push(key);
              }}
              style={{ height: "100%", borderInlineEnd: 0 }}
              items={sideBarItems}
            />
          </Sider>
          <Layout style={{ padding: "8px 16px" }} className="max-h-screen overflow-y-auto">
            {children}
          </Layout>
        </Layout>
      </Layout>
    </RequireAuth>
  );
};

export default ComponentLayout;
