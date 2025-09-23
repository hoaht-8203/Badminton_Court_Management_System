"use client";

import { ListSupplierResponse } from "@/types-openapi/api";
import { SupplierStatus } from "@/types/commons";
import { TableProps } from "antd";
import dayjs from "dayjs";

export const columns: TableProps<ListSupplierResponse>["columns"] = [
  { title: "Mã NCC", dataIndex: "id", key: "id", width: 120, fixed: "left" },
  { title: "Tên nhà cung cấp", dataIndex: "name", key: "name", width: 300, fixed: "left" },
  { title: "Số điện thoại", dataIndex: "phone", key: "phone", width: 160, render: (v) => v || "-" },
  { title: "Email", dataIndex: "email", key: "email", width: 220, render: (v) => v || "-" },
  { title: "Địa chỉ", dataIndex: "address", key: "address", width: 260, render: (v) => v || "-" },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 160,
    render: (status) =>
      status === SupplierStatus.Active ? (
        <span className="font-bold text-green-500">Đang hoạt động</span>
      ) : (
        <span className="font-bold text-red-500">Không hoạt động</span>
      ),
  },
  {
    title: "Ngày sửa đổi lần cuối",
    dataIndex: "updatedAt",
    key: "updatedAt",
    width: 170,
    render: (_, { createdAt, updatedAt }) => (
      <>{updatedAt ? dayjs(updatedAt).format("YYYY-MM-DD HH:mm:ss") : createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss") : "-"}</>
    ),
    fixed: "right",
  },
  {
    title: "Người sửa đổi lần cuối",
    dataIndex: "updatedBy",
    key: "updatedBy",
    width: 170,
    render: (_, { createdBy, updatedBy }) => <>{updatedBy ? updatedBy : createdBy ? createdBy : "-"}</>,
    fixed: "right",
  },
];
