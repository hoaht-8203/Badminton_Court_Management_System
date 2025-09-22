"use client";

import { ListAdministratorResponse } from "@/types-openapi/api";
import { ApplicationUserStatus } from "@/types/commons";
import { TableProps, Tag } from "antd";
import dayjs from "dayjs";

export const columns: TableProps<ListAdministratorResponse>["columns"] = [
  {
    title: "Họ và tên",
    dataIndex: "fullName",
    key: "fullName",
    width: 150,
    fixed: "left",
  },
  {
    title: "Tên người dùng",
    dataIndex: "userName",
    key: "userName",
    width: 150,
    fixed: "left",
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    width: 150,
  },
  {
    title: "Số điện thoại",
    dataIndex: "phoneNumber",
    key: "phoneNumber",
    width: 150,
    render: (_, { phoneNumber }) => <>{phoneNumber ? phoneNumber : "-"}</>,
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 150,
    render: (_, { status }) => (
      <>
        {status === ApplicationUserStatus.Active ? (
          <span className="font-bold text-green-500">Đang hoạt động</span>
        ) : (
          <span className="font-bold text-red-500">Không hoạt động</span>
        )}
      </>
    ),
  },
  {
    title: "Vai trò",
    key: "roles",
    dataIndex: "roles",
    width: 150,
    render: (_, { roles }) => (
      <div className="flex flex-wrap gap-2">
        {roles?.map((item) => {
          return (
            <Tag color={"green"} key={item} style={{ marginRight: 0 }}>
              {item.toUpperCase()}
            </Tag>
          );
        })}
      </div>
    ),
  },
  {
    title: "Ngày sinh",
    dataIndex: "dateOfBirth",
    key: "dateOfBirth",
    width: 150,
    render: (_, { dateOfBirth }) => <>{dateOfBirth ? dateOfBirth : "-"}</>,
  },
  {
    title: "Địa chỉ",
    dataIndex: "address",
    key: "address",
    width: 150,
    ellipsis: true,
    render: (_, { address }) => <>{address ? address : "-"}</>,
  },
  {
    title: "Thành phố",
    dataIndex: "city",
    key: "city",
    width: 150,
    render: (_, { city }) => <>{city ? city : "-"}</>,
  },
  {
    title: "Quận/Huyện",
    dataIndex: "district",
    key: "district",
    width: 150,
    render: (_, { district }) => <>{district ? district : "-"}</>,
  },
  {
    title: "Phường/Xã",
    dataIndex: "ward",
    key: "ward",
    width: 150,
    render: (_, { ward }) => <>{ward ? ward : "-"}</>,
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
