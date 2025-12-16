"use client";

import React from "react";

import { useAuth } from "@/context/AuthContext";
import { CurrentUserResponse } from "@/types-openapi/api";
import { LogoutOutlined, SettingOutlined, UserOutlined, CalendarOutlined, ToolOutlined, MessageOutlined, GiftOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Dropdown, Layout, Menu } from "antd";
import { ArrowLeftRight, ChartSpline, Columns2, FileText, Handshake, IdCardLanyard, Package, Settings } from "lucide-react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname, useRouter } from "next/navigation";
import RequireAuth from "@/components/authentication/RequireAuth";
import RoleGuard from "@/components/authentication/RoleGuard";
import { ROLES, hasAnyRole } from "@/constants/roles";
import { filterMenuByRoles, hasStaffAccess as checkStaffAccess, type MenuItemType } from "@/utils/rbac";

const allSideBarItems: MenuItemType[] = [
  {
    key: "/quanlysancaulong/dashboard",
    label: "Tổng quan",
    icon: <ChartSpline className="h-4 w-4" />,
    // All staff can view dashboard
    requiredRoles: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    key: "quanlyhanghoa",
    label: "Quản lý hàng hoá",
    icon: <Package className="h-4 w-4" />,
    // Management and warehouse staff
    requiredRoles: [ROLES.WAREHOUSE_STAFF],
    children: [
      {
        key: "/quanlysancaulong/quanlydanhmuc",
        label: "Quản lý danh mục",
      },
      {
        key: "/quanlysancaulong/thietlapgia",
        label: "Thiết lập giá",
      },
      {
        key: "/quanlysancaulong/inventory",
        label: "Kiểm kho",
      },
      {
        key: "/quanlysancaulong/stock-in",
        label: "Nhập kho",
      },
      {
        key: "/quanlysancaulong/stock-out",
        label: "Xuất huỷ",
      },
      {
        key: "/quanlysancaulong/stock-return",
        label: "Trả hàng nhập",
      },
    ],
  },
  {
    key: "/quanlysancaulong/court-schedule",
    label: "Quản lý lịch đặt sân",
    icon: <CalendarOutlined className="h-4 w-4" />,
    // Office staff (Staff, Receptionist, Management)
    requiredRoles: [ROLES.RECEPTIONIST],
  },
  {
    key: "/quanlysancaulong/courts",
    label: "Quản lý sân cầu lông",
    icon: <Columns2 className="h-4 w-4" />,
    // Management only
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    key: "/quanlysancaulong/services",
    label: "Quản lý dịch vụ",
    icon: <ToolOutlined className="h-4 w-4" />,
    // Management only
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    key: "quanlygiaodich",
    label: "Quản lý giao dịch",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    // Office staff
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR, ROLES.RECEPTIONIST],
    children: [
      {
        key: "/quanlysancaulong/orders",
        label: "Quản lý hoá đơn",
      },
    ],
  },
  {
    key: "quanlydoitac",
    label: "Quản lý đối tác",
    icon: <Handshake className="h-4 w-4" />,
    // Management only for suppliers, office staff for customers/memberships
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
    children: [
      {
        key: "/quanlysancaulong/customers",
        label: "Quản lý khách hàng",
      },
      {
        key: "/quanlysancaulong/memberships",
        label: "Quản lý gói hội viên",
      },
      {
        key: "/quanlysancaulong/suppliers",
        label: "Quản lý nhà cung cấp",
      },
    ],
  },
  {
    key: "quanlynhanvien",
    label: "Quản lý nhân viên",
    icon: <IdCardLanyard className="h-4 w-4" />,
    // Management only
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
    children: [
      {
        key: "/quanlysancaulong/list-staff",
        label: "Danh sách nhân viên",
        requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
      },
      {
        key: "/quanlysancaulong/shift",
        label: "Ca làm việc",
        requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
      },
      {
        key: "/quanlysancaulong/work-schedule",
        label: "Lịch làm việc",
        requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
      },
      {
        key: "/quanlysancaulong/salary",
        label: "Bảng lương",
        requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
      },
      {
        key: "/quanlysancaulong/employee-configuration",
        label: "Thiết lập nhân viên",
        requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
      },
    ],
  },
  {
    key: "quantriungdung",
    label: "Quản trị ứng dụng",
    icon: <Settings className="h-4 w-4" />,
    // Admin only
    requiredRoles: [ROLES.ADMIN],
    children: [
      {
        key: "/quanlysancaulong/users",
        label: "Quản lý người dùng",
        requiredRoles: [ROLES.ADMIN],
      },
      {
        key: "/quanlysancaulong/roles",
        label: "Quản lý vai trò",
        requiredRoles: [ROLES.ADMIN],
      },
      {
        key: "/quanlysancaulong/feedbacks",
        label: "Quản lý feedback",
        requiredRoles: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR],
      },
    ],
  },
  {
    key: "quanlynoidung",
    label: "Quản lý nội dung",
    icon: <FileText className="h-4 w-4" />,
    // Management only
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
    children: [
      {
        key: "/quanlysancaulong/blogs",
        label: "Quản lý bài viết",
        requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
      },
      {
        key: "/quanlysancaulong/sliders",
        label: "Quản lý slider",
        requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
      },
    ],
  },
  {
    key: "/quanlysancaulong/vouchers",
    label: "Quản lý voucher",
    icon: <GiftOutlined className="h-4 w-4" />,
    // Management only
    requiredRoles: [ROLES.BRANCH_ADMINISTRATOR],
  },
  {
    key: "/quanlysancaulong/cashier",
    label: "Thu ngân",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    // Receptionist only
    requiredRoles: [ROLES.RECEPTIONIST],
  },
  {
    key: "cashflow",
    label: "Sổ quỹ",
    icon: <IdCardLanyard className="h-4 w-4" />,
    // Office staff
    requiredRoles: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR],
  },
];

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
      onClick: () => router.push("/quanlysancaulong/users/profile"),
    },
    {
      key: "admin-panel",
      label: "Quản lý sân cầu lông",
      icon: <SettingOutlined />,
      requiredRoles: [ROLES.ADMIN, ROLES.BRANCH_ADMINISTRATOR],
      onClick: () => router.push("/quanlysancaulong/dashboard"),
    },
    {
      key: "staff-panel",
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

const { Header, Sider } = Layout;

const ComponentLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  // Check if user has staff access (any role except Customer/User)
  const hasAccess = React.useMemo(() => {
    if (!user) return false;
    const userRoles = user.roles || [];
    return checkStaffAccess(userRoles);
  }, [user]);

  // Filter sidebar items based on user roles
  const sideBarItems = React.useMemo(() => {
    const userRoles = user?.roles || [];
    return filterMenuByRoles(allSideBarItems, userRoles);
  }, [user?.roles]);

  const findParentKeyByPath = React.useCallback(
    (path: string): string | undefined => {
      const parent = (sideBarItems || []).find((item) => item && "children" in item && item.children?.some((child) => String(child?.key) === path));
      return parent?.key ? String(parent.key) : undefined;
    },
    [sideBarItems],
  );

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

  // Don't render layout if user doesn't have staff access
  if (!loading && user && !hasAccess) {
    return null;
  }

  return (
    <RequireAuth fallback={null}>
      <RoleGuard checkRoutePermissions={true}>
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
            <div className="flex items-center gap-5">
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
      </RoleGuard>
    </RequireAuth>
  );
};

export default ComponentLayout;
