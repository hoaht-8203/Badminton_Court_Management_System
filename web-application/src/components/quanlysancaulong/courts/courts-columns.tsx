"use client";

import { ListCourtResponse } from "@/types-openapi/api";
import { CourtStatus } from "@/types/commons";
import { TableProps } from "antd";
import dayjs from "dayjs";

export const columns: TableProps<ListCourtResponse>["columns"] = [
  { title: "Tên sân", dataIndex: "name", key: "name", width: 200, fixed: "left" },
  { title: "Khu vực", dataIndex: "courtAreaName", key: "courtAreaName", width: 160, render: (v) => v || "-" },
  { title: "Ghi chú", dataIndex: "note", key: "note", width: 220, render: (v) => v || "-" },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 150,
    render: (status?: string | null) =>
      status === CourtStatus.Active ? (
        <span className="font-bold text-green-500">Đang hoạt động</span>
      ) : status === CourtStatus.Maintenance ? (
        <span className="font-bold text-yellow-600">Bảo trì</span>
      ) : (
        <span className="font-bold text-red-500">Không hoạt động</span>
      ),
  },
  {
    title: "Ngày sửa đổi lần cuối",
    dataIndex: "updatedAt",
    key: "updatedAt",
    width: 170,
    render: (_: unknown, { createdAt, updatedAt }) => (
      <>{updatedAt ? dayjs(updatedAt).format("YYYY-MM-DD HH:mm:ss") : createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss") : "-"}</>
    ),
    fixed: "right",
  },
  {
    title: "Người sửa đổi lần cuối",
    dataIndex: "updatedBy",
    key: "updatedBy",
    width: 170,
    render: (_: unknown, { createdBy, updatedBy }) => <>{updatedBy ? updatedBy : createdBy ? createdBy : "-"}</>,
    fixed: "right",
  },
];
