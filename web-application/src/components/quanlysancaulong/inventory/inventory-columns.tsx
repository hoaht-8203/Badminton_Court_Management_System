"use client";

import { InventoryCheck, InventoryCheckStatus } from "@/types-openapi/api";
import { TableProps, Tag } from "antd";
import dayjs from "dayjs";

// Inventory status mapping
const statusColors = {
  0: "orange", // Chờ kiểm kê
  1: "green", // Đã hoàn thành
  2: "red", // Đã hủy
} as const;

const statusLabels = {
  0: "Chờ kiểm kê",
  1: "Đã hoàn thành",
  2: "Đã hủy",
} as const;

export const inventoryColumns: TableProps<InventoryCheck>["columns"] = [
  {
    title: "Mã kiểm kê",
    dataIndex: "code",
    key: "code",
    width: 120,
    sorter: (a, b) => (a.code || "").localeCompare(b.code || ""),
  },
  {
    title: "Thời gian kiểm kê",
    dataIndex: "checkTime",
    key: "checkTime",
    width: 150,
    render: (date: Date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    sorter: (a, b) => {
      const aTime = a.checkTime ? new Date(a.checkTime).getTime() : 0;
      const bTime = b.checkTime ? new Date(b.checkTime).getTime() : 0;
      return aTime - bTime;
    },
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: InventoryCheckStatus) => <Tag color={statusColors[status ?? 0]}>{statusLabels[status ?? 0]}</Tag>,
    filters: Object.entries(statusLabels).map(([key, label]) => ({
      text: label,
      value: parseInt(key),
    })),
    onFilter: (value, record) => record.status === value,
  },
  {
    title: "Ghi chú",
    dataIndex: "note",
    key: "note",
    ellipsis: true,
  },
  {
    title: "Người tạo",
    dataIndex: "createdBy",
    key: "createdBy",
    width: 100,
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 150,
    render: (date: Date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
  },
];
