"use client";

import { InventoryCheck, InventoryCheckStatus } from "@/types-openapi/api";
import { TableProps, Tag, Button, Tooltip } from "antd";
import { ExclamationCircleOutlined, StopOutlined } from "@ant-design/icons";
import { useDeleteInventoryCheck } from "@/hooks/useInventory";
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
    render: (t: string) => {
      const isWarning = typeof t === "string" && t.toLowerCase().includes("cảnh báo");
      return (
        <div
          className={`flex items-center gap-2 ${isWarning ? "rounded-md border px-2 py-1" : ""}`}
          style={
            isWarning
              ? { background: "#fffbe6", borderColor: "#ffe58f", color: "#ad6800" }
              : undefined
          }
        >
          {isWarning && (
            <Tooltip title="Cảnh báo">
              <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            </Tooltip>
          )}
          <span className="whitespace-pre-wrap">{t}</span>
        </div>
      );
    },
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
  {
    title: "Thao tác",
    key: "actions",
    width: 120,
    render: (_: any, record) => {
      // Show different actions based on status
      if (record.status === 2) {
        return <span className="text-gray-400 text-sm">Đã hủy</span>;
      }
      if (record.status === 0) {
        return <CancelActionButton id={record.id!} disabled={false} />;
      }
      return null;
    },
  },
];

const CancelActionButton = ({ id, disabled }: { id: number; disabled: boolean }) => {
  const mutation = useDeleteInventoryCheck();
  return (
    <Button
      icon={<StopOutlined />}
      size="small"
      disabled={disabled || mutation.isPending}
      onClick={() => mutation.mutate(id)}
      className="!border-red-500 !bg-red-500 !text-white hover:!border-red-500 hover:!bg-red-500 hover:!text-white focus:!shadow-none active:!bg-red-500"
    >
      Hủy phiếu
    </Button>
  );
};
