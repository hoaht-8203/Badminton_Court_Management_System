"use client";

import { ListMembershipResponse } from "@/types-openapi/api";
import { TableProps } from "antd";
import dayjs from "dayjs";

export const columns: TableProps<ListMembershipResponse>["columns"] = [
  {
    title: "Tên gói",
    dataIndex: "name",
    key: "name",
    width: 200,
  },
  {
    title: "Giá",
    dataIndex: "price",
    key: "price",
    width: 120,
    render: (_, { price }) => <>{price?.toLocaleString("vi-VN")}</>,
  },
  {
    title: "% Giảm",
    dataIndex: "discountPercent",
    key: "discountPercent",
    width: 120,
  },
  {
    title: "Thời hạn (ngày)",
    dataIndex: "durationDays",
    key: "durationDays",
    width: 150,
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 140,
    render: (_, { status }) => (
      <>
        {status === "Active" ? (
          <span className="font-bold text-green-500">Đang hoạt động</span>
        ) : (
          <span className="font-bold text-red-500">Không hoạt động</span>
        )}
      </>
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
  },
  {
    title: "Người sửa đổi lần cuối",
    dataIndex: "updatedBy",
    key: "updatedBy",
    width: 170,
    render: (_, { createdBy, updatedBy }) => <>{updatedBy ? updatedBy : createdBy ? createdBy : "-"}</>,
  },
];
