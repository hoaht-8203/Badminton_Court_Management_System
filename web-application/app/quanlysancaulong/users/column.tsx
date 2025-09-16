"use client";

import { ListAdministratorResponse } from "@/types-openapi/api";
import { Space, TableProps, Tag } from "antd";
import dayjs from "dayjs";

export const columns: TableProps<ListAdministratorResponse>["columns"] = [
  {
    title: "Full Name",
    dataIndex: "fullName",
    key: "fullName",
    width: 150,
  },
  {
    title: "UserName",
    dataIndex: "userName",
    key: "userName",
    width: 150,
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    width: 150,
  },
  {
    title: "Phone Number",
    dataIndex: "phoneNumber",
    key: "phoneNumber",
    width: 150,
    render: (_, { phoneNumber }) => <>{phoneNumber ? phoneNumber : "-"}</>,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 150,
  },
  {
    title: "Roles",
    key: "role",
    dataIndex: "role",
    width: 150,
    render: (_, { role }) => (
      <>
        {role?.map((item) => {
          return (
            <Tag color={"green"} key={item}>
              {item.toUpperCase()}
            </Tag>
          );
        })}
      </>
    ),
  },
  {
    title: "Date Of Birth",
    dataIndex: "dateOfBirth",
    key: "dateOfBirth",
    width: 150,
    render: (_, { dateOfBirth }) => <>{dateOfBirth ? dateOfBirth : "-"}</>,
  },
  {
    title: "Address",
    dataIndex: "address",
    key: "address",
    width: 150,
    render: (_, { address }) => <>{address ? address : "-"}</>,
  },
  {
    title: "City",
    dataIndex: "city",
    key: "city",
    width: 150,
    render: (_, { city }) => <>{city ? city : "-"}</>,
  },
  {
    title: "District",
    dataIndex: "district",
    key: "district",
    width: 150,
    render: (_, { district }) => <>{district ? district : "-"}</>,
  },
  {
    title: "Ward",
    dataIndex: "ward",
    key: "ward",
    width: 150,
    render: (_, { ward }) => <>{ward ? ward : "-"}</>,
  },
  {
    title: "Last Modified",
    dataIndex: "updatedAt",
    key: "updatedAt",
    width: 170,
    render: (_, { createdAt, updatedAt }) => (
      <>
        {updatedAt
          ? dayjs(updatedAt).format("YYYY-MM-DD HH:mm:ss")
          : createdAt
          ? dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss")
          : "-"}
      </>
    ),
    fixed: "right",
  },
  {
    title: "Last Modified By",
    dataIndex: "updatedBy",
    key: "updatedBy",
    width: 150,
    render: (_, { createdBy, updatedBy }) => (
      <>{updatedBy ? updatedBy : createdBy ? createdBy : "-"}</>
    ),
    fixed: "right",
  },
];
