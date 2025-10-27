import { ColumnsType } from "antd/es/table";
import { ListSliderResponse } from "@/types-openapi/api";
import { Image } from "antd";

export const columns: ColumnsType<ListSliderResponse> = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    width: 80,
    sorter: (a, b) => (a.id ?? 0) - (b.id ?? 0),
  },
  {
    title: "Tiêu đề",
    dataIndex: "title",
    key: "title",
    width: 200,
    ellipsis: true,
  },
  {
    title: "Mô tả",
    dataIndex: "description",
    key: "description",
    width: 250,
    ellipsis: true,
    render: (text: string) => text || "-",
  },
  {
    title: "Hình ảnh",
    dataIndex: "imageUrl",
    key: "imageUrl",
    width: 120,
    render: (imageUrl: string) => {
      if (!imageUrl) return <span className="text-gray-500">Không có hình</span>;
      return (
        <div className="flex items-center justify-center">
          <Image src={imageUrl} alt="Slider" width={200} className="rounded object-cover" />
        </div>
      );
    },
  },
  {
    title: "Liên kết",
    dataIndex: "backLink",
    key: "backLink",
    width: 150,
    ellipsis: true,
    render: (text: string) => text || "-",
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: string) => {
      return status === "Active" ? (
        <span className="font-bold text-green-500">Đang hoạt động</span>
      ) : (
        <span className="font-bold text-red-500">Không hoạt động</span>
      );
    },
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 150,
    render: (date: string) => (date ? new Date(date).toLocaleString("vi-VN") : "-"),
    sorter: (a, b) => new Date(a.createdAt ?? "").getTime() - new Date(b.createdAt ?? "").getTime(),
  },
];
