"use client";

import { ListFeedbackResponse } from "@/types-openapi/api";
import { TableProps, Tag, Rate } from "antd";
import dayjs from "dayjs";

export const createFeedbackColumns = (): TableProps<ListFeedbackResponse>["columns"] => [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    width: 80,
    fixed: "left",
  },
  {
    title: "Khách hàng",
    dataIndex: "customerId",
    key: "customerId",
    width: 120,
    render: (customerId) => <span>ID: {customerId}</span>,
  },
  {
    title: "Đánh giá",
    dataIndex: "rating",
    key: "rating",
    width: 150,
    render: (rating: number) => <Rate disabled defaultValue={rating} />,
  },
  {
    title: "Bình luận",
    dataIndex: "comment",
    key: "comment",
    width: 300,
    ellipsis: true,
    render: (comment: string | null) => (
      <span title={comment || ""}>{comment ? (comment.length > 50 ? `${comment.substring(0, 50)}...` : comment) : "-"}</span>
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: string) => {
      const colorMap: Record<string, string> = {
        Active: "green",
        Deleted: "red",
        Hidden: "orange",
      };
      const labelMap: Record<string, string> = {
        Active: "Hoạt động",
        Deleted: "Đã xóa",
        Hidden: "Ẩn",
      };
      return <Tag color={colorMap[status] || "default"}>{labelMap[status] || status}</Tag>;
    },
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 180,
    render: (createdAt: string) => (createdAt ? dayjs(createdAt).format("DD/MM/YYYY HH:mm") : "-"),
    sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
  },
];

