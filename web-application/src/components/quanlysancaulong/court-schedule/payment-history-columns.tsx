import { PaymentDto } from "@/types-openapi/api";
import { TableProps, Tag } from "antd";

export const paymentHistoryColumns: TableProps<PaymentDto>["columns"] = [
  {
    title: "Mã thanh toán",
    dataIndex: "id",
    key: "id",
    width: 120,
    render: (id: string) => <span className="font-mono text-xs">{id?.substring(0, 8)}...</span>,
  },
  {
    title: "Mã đặt sân",
    dataIndex: "bookingId",
    key: "bookingId",
    width: 120,
    render: (bookingId: string) => <span className="font-mono text-xs">{bookingId?.substring(0, 8)}...</span>,
  },
  {
    title: "Số tiền",
    dataIndex: "amount",
    key: "amount",
    width: 120,
    render: (amount: number) => <span className="font-medium text-green-600">{amount ? `${amount.toLocaleString("vi-VN")} đ` : "-"}</span>,
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: string) => {
      const statusConfig = {
        Completed: { color: "green", text: "Hoàn thành" },
        Pending: { color: "orange", text: "Đang chờ" },
        Failed: { color: "red", text: "Thất bại" },
        Cancelled: { color: "red", text: "Đã hủy" },
      };

      const config = statusConfig[status as keyof typeof statusConfig] || { color: "default", text: status };
      return <Tag color={config.color}>{config.text}</Tag>;
    },
  },
  {
    title: "Khách hàng",
    dataIndex: "customerName",
    key: "customerName",
    width: 150,
    render: (customerName: string, record: PaymentDto) => (
      <div>
        <div className="font-medium">{customerName || "-"}</div>
        <div className="text-xs text-gray-500">ID: {record.customerId || "-"}</div>
      </div>
    ),
  },
  {
    title: "Liên hệ",
    key: "contact",
    width: 150,
    render: (record: PaymentDto) => (
      <div>
        <div className="text-sm">{record.customerPhone || "-"}</div>
        <div className="text-xs text-gray-500">{record.customerEmail || "-"}</div>
      </div>
    ),
  },
  {
    title: "Sân",
    dataIndex: "courtName",
    key: "courtName",
    width: 120,
    render: (courtName: string, record: PaymentDto) => (
      <div>
        <div className="font-medium">{courtName || "-"}</div>
        <div className="text-xs text-gray-500">ID: {record.courtId || "-"}</div>
      </div>
    ),
  },
  {
    title: "Ngày thanh toán",
    dataIndex: "paymentCreatedAt",
    key: "paymentCreatedAt",
    width: 150,
    render: (paymentCreatedAt: Date) => <span>{paymentCreatedAt ? new Date(paymentCreatedAt).toLocaleString("vi-VN") : "-"}</span>,
  },
];
