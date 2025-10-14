"use client";

import { ListServiceResponse } from "@/types-openapi/api";
import { ServiceStatus } from "@/types/commons";
import { ToolOutlined } from "@ant-design/icons";
import { TableProps, Avatar } from "antd";
import dayjs from "dayjs";

export const columns: TableProps<ListServiceResponse>["columns"] = [
  {
    title: "Mã dịch vụ",
    dataIndex: "code",
    key: "code",
    width: 120,
    fixed: "left",
  },
  {
    title: "Tên dịch vụ",
    dataIndex: "name",
    key: "name",
    width: 200,
    fixed: "left",
    render: (_, { name, imageUrl }) => (
      <div className="flex items-center gap-2">
        <Avatar src={imageUrl} icon={<ToolOutlined />} size={32} className="flex-shrink-0" />
        <span className="font-medium">{name || "-"}</span>
      </div>
    ),
  },
  {
    title: "Mô tả",
    dataIndex: "description",
    key: "description",
    width: 250,
    render: (description) => description || "-",
  },
  {
    title: "Danh mục",
    dataIndex: "category",
    key: "category",
    width: 120,
    render: (category) => {
      return <>{category === "Equipment" ? "Thiết bị" : category === "Referee" ? "Trọng tài" : category === "Clothing" ? "Quần áo" : "Khác"}</>;
    },
  },
  {
    title: "Giá/giờ",
    dataIndex: "pricePerHour",
    key: "pricePerHour",
    width: 120,
    render: (pricePerHour) => (pricePerHour ? `${pricePerHour.toLocaleString("vi-VN")} VND` : "-"),
  },
  {
    title: "Số lượng",
    dataIndex: "stockQuantity",
    key: "stockQuantity",
    width: 100,
    render: (stockQuantity) => stockQuantity || 0,
  },
  {
    title: "Đơn vị",
    dataIndex: "unit",
    key: "unit",
    width: 100,
    render: (unit) => unit || "-",
  },

  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 150,
    render: (status) => {
      return (
        <>
          {status === ServiceStatus.Active ? (
            <span className="font-bold text-green-500">Đang hoạt động</span>
          ) : (
            <span className="font-bold text-red-500">Không hoạt động</span>
          )}
        </>
      );
    },
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
