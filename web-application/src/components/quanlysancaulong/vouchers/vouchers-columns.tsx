"use client";

import { VoucherResponse } from "@/types-openapi/api";
import { TableProps, Tag } from "antd";
import dayjs from "dayjs";

export const createVouchersColumns = (): TableProps<VoucherResponse>["columns"] => [
  {
    title: "Mã voucher",
    dataIndex: "code",
    key: "code",
    width: 150,
    fixed: "left",
    sorter: (a, b) => (a.code ?? "").localeCompare(b.code ?? ""),
    render: (code) => <span className="font-mono font-semibold">{code}</span>,
  },
  {
    title: "Tiêu đề",
    dataIndex: "title",
    key: "title",
    width: 200,
    sorter: (a, b) => (a.title ?? "").localeCompare(b.title ?? ""),
  },
  {
    title: "Loại giảm giá",
    dataIndex: "discountType",
    key: "discountType",
    width: 120,
    sorter: (a, b) => (a.discountType ?? "").localeCompare(b.discountType ?? ""),
    render: (type) => <Tag color={type === "percentage" ? "blue" : "green"}>{type === "percentage" ? "Phần trăm" : "Cố định"}</Tag>,
  },
  {
    title: "Giá trị giảm",
    key: "discountValue",
    width: 150,
    sorter: (a, b) => {
      const aValue = a.discountType === "percentage" ? (a.discountPercentage ?? 0) : (a.discountValue ?? 0);
      const bValue = b.discountType === "percentage" ? (b.discountPercentage ?? 0) : (b.discountValue ?? 0);
      return aValue - bValue;
    },
    render: (_, record) => {
      if (record.discountType === "percentage") {
        const pct = record.discountPercentage ?? 0;
        const max = record.maxDiscountValue;
        return `${pct}%${max ? ` (tối đa ${max.toLocaleString("vi-VN")} VNĐ)` : ""}`;
      }
      const val = record.discountValue ?? 0;
      return `${val.toLocaleString("vi-VN")} VNĐ`;
    },
  },
  {
    title: "Đơn tối thiểu",
    dataIndex: "minOrderValue",
    key: "minOrderValue",
    width: 150,
    sorter: (a, b) => (a.minOrderValue ?? 0) - (b.minOrderValue ?? 0),
    render: (value) => (value ? `${value.toLocaleString("vi-VN")} VNĐ` : "-"),
  },
  {
    title: "Ngày bắt đầu",
    dataIndex: "startAt",
    key: "startAt",
    width: 180,
    sorter: (a, b) => {
      const aDate = a.startAt ? new Date(a.startAt).getTime() : 0;
      const bDate = b.startAt ? new Date(b.startAt).getTime() : 0;
      return aDate - bDate;
    },
    render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-"),
  },
  {
    title: "Ngày kết thúc",
    dataIndex: "endAt",
    key: "endAt",
    width: 180,
    sorter: (a, b) => {
      const aDate = a.endAt ? new Date(a.endAt).getTime() : 0;
      const bDate = b.endAt ? new Date(b.endAt).getTime() : 0;
      return aDate - bDate;
    },
    render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-"),
  },
  {
    title: "Giới hạn",
    key: "limits",
    width: 150,
    sorter: (a, b) => (a.usageLimitTotal ?? 0) - (b.usageLimitTotal ?? 0),
    render: (_, record) => (
      <div>
        <div>
          Tổng:{" "}
          {record.usageLimitTotal === 0 ? "Không giới hạn" : record.usageLimitTotal ? `${record.usedCount ?? 0}/${record.usageLimitTotal}` : "-"}
        </div>
        <div>Mỗi user: {record.usageLimitPerUser === 0 ? "Không giới hạn" : (record.usageLimitPerUser ?? "-")}</div>
      </div>
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    key: "isActive",
    width: 120,
    sorter: (a, b) => Number(a.isActive ?? false) - Number(b.isActive ?? false),
    render: (isActive) => <Tag color={isActive ? "green" : "red"}>{isActive ? "Hoạt động" : "Không hoạt động"}</Tag>,
  },
];
