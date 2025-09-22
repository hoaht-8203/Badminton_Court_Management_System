"use client";

import { ListCustomerResponse } from "@/types-openapi/api";
import { CustomerStatus } from "@/types/commons";
import { UserOutlined } from "@ant-design/icons";
import { TableProps } from "antd";
import dayjs from "dayjs";

export const columns: TableProps<ListCustomerResponse>["columns"] = [
  {
    title: "Mã khách hàng",
    dataIndex: "id",
    key: "id",
    width: 120,
    fixed: "left",
  },
  {
    title: "Họ và tên",
    dataIndex: "fullName",
    key: "fullName",
    width: 200,
    fixed: "left",
    render: (_, { fullName }) => (
      <div className="flex items-center gap-2">
        <UserOutlined className="text-blue-500" />
        <span className="font-medium">{fullName || "-"}</span>
      </div>
    ),
  },
  {
    title: "Số điện thoại",
    dataIndex: "phoneNumber",
    key: "phoneNumber",
    width: 150,
    render: (phoneNumber) => phoneNumber || "-",
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    width: 200,
    render: (email) => email || "-",
  },
  {
    title: "Giới tính",
    dataIndex: "gender",
    key: "gender",
    width: 100,
  },
  {
    title: "Địa chỉ",
    dataIndex: "address",
    key: "address",
    width: 250,
    render: (address) => address || "-",
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 150,
    render: (status) => {
      return (
        <>
          {status === CustomerStatus.Active ? (
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
