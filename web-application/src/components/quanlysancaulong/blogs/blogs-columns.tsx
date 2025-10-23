"use client";

import { ListBlogResponse } from "@/types-openapi/api";
import { FileTextOutlined } from "@ant-design/icons";
import { TableProps, Avatar, Image } from "antd";
import dayjs from "dayjs";

export const columns: TableProps<ListBlogResponse>["columns"] = [
  {
    title: "Tiêu đề",
    dataIndex: "title",
    key: "title",
    width: 300,
    fixed: "left",
    render: (_, { title, imageUrl }) => (
      <div className="flex items-center gap-3">
        {imageUrl ? (
          <Image src={imageUrl} alt={title ?? ""} width={300} className="flex-shrink-0 rounded object-cover" preview={false} />
        ) : (
          <Avatar icon={<FileTextOutlined />} size={40} className="flex-shrink-0" />
        )}
        <span className="font-medium">{title ?? "-"}</span>
      </div>
    ),
  },
  {
    title: "Nội dung",
    dataIndex: "content",
    key: "content",
    width: 400,
    render: (content) => (
      <div className="max-w-xs">
        <div
          className="line-clamp-3 text-sm text-gray-600"
          dangerouslySetInnerHTML={{
            __html: content?.substring(0, 200) + (content && content.length > 200 ? "..." : "") || "-",
          }}
        />
      </div>
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 150,
    render: (status) => {
      return (
        <>
          {status === "Active" ? (
            <span className="font-bold text-green-500">Đang hoạt động</span>
          ) : (
            <span className="font-bold text-red-500">Không hoạt động</span>
          )}
        </>
      );
    },
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 170,
    render: (createdAt) => <>{createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss") : "-"}</>,
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
