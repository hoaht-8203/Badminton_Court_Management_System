import { ListBookingCourtResponse } from "@/types-openapi/api";
import { BookingCourtStatus } from "@/types/commons";
import { TableProps, Tag } from "antd";
import dayjs from "dayjs";

export const columns: TableProps<ListBookingCourtResponse>["columns"] = [
  {
    title: "Khách hàng",
    dataIndex: "customerName",
    key: "customerName",
    width: 150,
    render: (customerName: string, record: ListBookingCourtResponse) => (
      <div>
        <div className="font-medium">{customerName || "-"}</div>
        <div className="text-xs text-gray-500">Mã khách hàng: {record.customerId || "-"}</div>
      </div>
    ),
  },
  {
    title: "Sân",
    dataIndex: "courtName",
    key: "courtName",
    width: 130,
    render: (courtName: string) => <div className="font-medium"> {courtName || "-"}</div>,
  },
  {
    title: "Ngày đặt",
    dataIndex: "startDate",
    key: "startDate",
    width: 120,
    render: (startDate: string) => <span>{dayjs(startDate).format("DD/MM/YYYY")}</span>,
  },
  {
    title: "Thời gian",
    key: "timeRange",
    width: 150,
    render: (record: ListBookingCourtResponse) => (
      <div>
        <div className="font-medium">
          {dayjs(record.startTime, "HH:mm:ss").format("HH:mm")} - {dayjs(record.endTime, "HH:mm:ss").format("HH:mm")}
        </div>
        <div className="text-xs text-gray-500">
          Tổng thời gian: {dayjs(record.endTime, "HH:mm:ss").diff(dayjs(record.startTime, "HH:mm:ss"), "hour", true).toFixed(1)} giờ
        </div>
      </div>
    ),
  },
  {
    title: "Ngày trong tuần",
    dataIndex: "daysOfWeek",
    key: "daysOfWeek",
    width: 120,
    render: (daysOfWeek: number[]) => {
      if (!daysOfWeek || daysOfWeek.length === 0) {
        return <Tag color="blue">Vãng lai</Tag>;
      }

      const dayNames = {
        2: "T2",
        3: "T3",
        4: "T4",
        5: "T5",
        6: "T6",
        7: "T7",
        8: "CN",
      };

      return (
        <div className="flex flex-wrap gap-1">
          {daysOfWeek.map((day) => (
            <Tag key={day} color="green">
              {dayNames[day as keyof typeof dayNames]}
            </Tag>
          ))}
        </div>
      );
    },
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 150,
    render: (status: string) => {
      const statusConfig = {
        [BookingCourtStatus.Active]: { color: "green", text: "Đã đặt & thanh toán" },
        [BookingCourtStatus.PendingPayment]: { color: "orange", text: "Đã đặt - chưa thanh toán" },
        [BookingCourtStatus.Completed]: { color: "blue", text: "Hoàn tất" },
        [BookingCourtStatus.Cancelled]: { color: "red", text: "Đã hủy" },
        [BookingCourtStatus.NoShow]: { color: "orange", text: "Không đến" },
      };

      const config = statusConfig[status as keyof typeof statusConfig] || { color: "default", text: status };

      return <Tag color={config.color}>{config.text}</Tag>;
    },
  },
];
