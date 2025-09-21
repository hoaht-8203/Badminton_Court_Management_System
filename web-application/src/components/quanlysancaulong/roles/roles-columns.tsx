"use client";

import { ListRoleResponse } from "@/types-openapi/api";
import { TableProps, Tag } from "antd";

export const columns: TableProps<ListRoleResponse>["columns"] = [
  {
    title: "ID Vai trò",
    dataIndex: "roleId",
    key: "roleId",
    width: 200,
    fixed: "left",
  },
  {
    title: "Tên vai trò",
    dataIndex: "roleName",
    key: "roleName",
    width: 200,
    fixed: "left",
    render: (_, { roleName }) => (
      <Tag color="blue" className="font-medium">
        {roleName?.toUpperCase() || "-"}
      </Tag>
    ),
  },
  {
    title: "Số lượng người dùng",
    dataIndex: "totalUsers",
    key: "totalUsers",
    width: 200,
  },
];
