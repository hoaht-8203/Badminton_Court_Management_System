import { ListOrderResponse } from "@/types-openapi/api";
import { ColumnsType } from "antd/es/table";
import { Tag } from "antd";

export const columns: ColumnsType<ListOrderResponse> = [
  {
    title: "Mã đơn hàng",
    dataIndex: "id",
    key: "id",
    width: 120,
    render: (_, record) => <span className="font-mono text-sm">{record.orderCode || record.id}</span>,
  },
  {
    title: "Khách hàng",
    key: "customer",
    width: 200,
    render: (_, record) => (
      <div>
        <div className="font-medium">{record.customer?.fullName || "-"}</div>
        <div className="text-sm text-gray-500">{record.customer?.phoneNumber || "-"}</div>
      </div>
    ),
  },
  {
    title: "Sân",
    key: "court",
    width: 150,
    render: (_, record) => (
      <div>
        <div className="font-medium">{record.courtName || "-"}</div>
        <div className="text-sm text-gray-500">{record.courtAreaName || "-"}</div>
        <div className="text-sm text-gray-500">
          {record.bookingCourtOccurrence?.date ? new Date(record.bookingCourtOccurrence.date).toLocaleDateString("vi-VN") : "-"}
        </div>
      </div>
    ),
  },
  {
    title: "Thời gian",
    key: "time",
    width: 150,
    render: (_, record) => (
      <div>
        <div className="text-sm">
          {record.bookingCourtOccurrence?.startTime || "-"} - {record.bookingCourtOccurrence?.endTime || "-"}
        </div>
      </div>
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: string) => {
      const getStatusColor = (status: string) => {
        switch (status) {
          case "Pending":
            return "orange";
          case "Paid":
            return "green";
          case "Cancelled":
            return "red";
          case "Refunded":
            return "blue";
          default:
            return "default";
        }
      };

      const getStatusText = (status: string) => {
        switch (status) {
          case "Pending":
            return "Chờ thanh toán";
          case "Paid":
            return "Đã thanh toán";
          case "Cancelled":
            return "Đã hủy";
          case "Refunded":
            return "Đã hoàn tiền";
          default:
            return status;
        }
      };

      return <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>;
    },
  },
  {
    title: "Phương thức thanh toán",
    dataIndex: "paymentMethod",
    key: "paymentMethod",
    width: 150,
    render: (method: string) => {
      const getMethodText = (method: string) => {
        switch (method) {
          case "Cash":
            return "Tiền mặt";
          case "Bank":
            return "Chuyển khoản";
          default:
            return method;
        }
      };

      return <span>{getMethodText(method)}</span>;
    },
  },
  {
    title: "Tổng tiền",
    dataIndex: "totalAmount",
    key: "totalAmount",
    width: 120,
    render: (amount: number) => <span className="font-medium text-green-600">{Number(amount).toLocaleString("vi-VN")}₫</span>,
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 150,
    render: (date: string) => <span className="text-sm">{new Date(date).toLocaleString("vi-VN")}</span>,
  },
];
