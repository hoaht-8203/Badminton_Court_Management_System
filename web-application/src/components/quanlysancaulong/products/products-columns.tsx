"use client";

import { ListProductResponse } from "@/types-openapi/api";
import { TableProps } from "antd";

export const productColumns: TableProps<ListProductResponse>["columns"] = [
  { title: "Mã code", dataIndex: "code", key: "code", width: 150, fixed: "left" },
  { title: "Tên hàng", dataIndex: "name", key: "name", width: 220 },
  { title: "Nhóm hàng", dataIndex: "category", key: "category", width: 150 },
  { title: "Giá bán", dataIndex: "salePrice", key: "salePrice", width: 120, sorter: (a, b) => (a.salePrice ?? 0) - (b.salePrice ?? 0) },
  {
    title: "Kinh doanh",
    dataIndex: "isActive",
    key: "isActive",
    width: 150,
    sorter: (a, b) => Number(!!a.isActive) - Number(!!b.isActive),
    render: (v?: boolean) => (
      <span className={`font-bold ${v ? "text-green-500" : "text-red-500"}`}>{v ? "Đang hoạt động" : "Ngừng hoạt động"}</span>
    ),
  },
  { title: "Bán trực tiếp", dataIndex: "isDirectSale", key: "isDirectSale", width: 120, render: (v) => (v ? "Có" : "Không") },
]; 