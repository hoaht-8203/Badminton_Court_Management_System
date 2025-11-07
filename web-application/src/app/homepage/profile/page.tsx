"use client";

import ProfilePage from "@/components/homepage/ProfilePage";
import { useGetUserBookingHistory } from "@/hooks/useSchedule";
import { ListUserBookingHistoryResponse, DetailBookingCourtResponse } from "@/types-openapi/api";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  HistoryOutlined,
  ReloadOutlined,
  UserOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Alert, Empty, Menu, Space, Spin, Table, Tag, Typography, Button } from "antd";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { exportService } from "@/services/exportService";
import { DownloadOutlined } from "@ant-design/icons";
import QrPaymentDrawer from "@/components/quanlysancaulong/court-schedule/qr-payment-drawer";

const { Title, Text } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
  {
    label: "Thông tin cá nhân",
    key: "profile",
    icon: <UserOutlined />,
  },
  {
    label: "Lịch sử đặt sân & Thanh toán",
    key: "booking-history",
    icon: <HistoryOutlined />,
  },
];

// Lazy load expandable content (tabs with details and payments) only when a row is expanded
type ExpandableProps = { record: ListUserBookingHistoryResponse };
const BookingExpandableContent = dynamic<ExpandableProps>(() => import("./_components/BookingExpandableContent"), {
  loading: () => (
    <div className="bg-gray-50 p-6">
      <Spin />
    </div>
  ),
  ssr: false,
});

const BookingHistoryPage = () => {
  const [current, setCurrent] = useState("profile");
  const { data, isLoading, error, refetch, isFetching } = useGetUserBookingHistory();
  const [openQrDrawer, setOpenQrDrawer] = useState(false);
  const [selectedBookingForQr, setSelectedBookingForQr] = useState<ListUserBookingHistoryResponse | null>(null);

  const onClick = useCallback<NonNullable<MenuProps["onClick"]>>((e) => {
    setCurrent(e.key);
  }, []);

  // Helper function to convert ListUserBookingHistoryResponse to DetailBookingCourtResponse
  const convertToDetailBooking = useCallback((booking: ListUserBookingHistoryResponse): DetailBookingCourtResponse => {
    return {
      id: booking.id,
      customerId: booking.customerId,
      courtId: booking.courtId,
      courtName: booking.courtName,
      startDate: booking.startDate,
      endDate: booking.endDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      daysOfWeek: booking.daysOfWeek,
      status: booking.status,
      totalHours: booking.totalHours,
      totalAmount: booking.totalAmount,
      paidAmount: booking.paidAmount,
      remainingAmount: booking.remainingAmount,
      customer: booking.customer,
      payments: booking.payments || [],
      bookingServices: [],
      bookingCourtOccurrences: booking.bookingCourtOccurrences || [],
      paymentId: booking.paymentId,
      paymentAmount: booking.paymentAmount,
      qrUrl: booking.qrUrl,
      holdMinutes: booking.holdMinutes,
      expiresAtUtc: booking.expiresAtUtc,
      overdueMinutes: 0,
      overdueHours: 0,
      surchargeAmount: 0,
      lateFeePercentage: 150,
      paymentType:
        booking.paidAmount && booking.totalAmount && booking.paidAmount >= booking.totalAmount * 0.99
          ? "Full"
          : booking.paidAmount && booking.paidAmount > 0
            ? "Deposit"
            : "None",
    };
  }, []);

  const handleShowQrPayment = useCallback((booking: ListUserBookingHistoryResponse) => {
    setSelectedBookingForQr(booking);
    setOpenQrDrawer(true);
  }, []);

  const handleCloseQrDrawer = useCallback(() => {
    setOpenQrDrawer(false);
    setSelectedBookingForQr(null);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    refetch();
    handleCloseQrDrawer();
  }, [refetch, handleCloseQrDrawer]);

  const columns = useMemo(
    () => [
      {
        title: "Sân",
        dataIndex: "courtName",
        key: "courtName",
        render: (text: string) => (
          <Space>
            <CalendarOutlined />
            <Text strong>{text}</Text>
          </Space>
        ),
        width: 200,
      },
      {
        title: "Ngày đặt",
        dataIndex: "startDate",
        key: "startDate",
        render: (date: Date) => dayjs(date).format("DD/MM/YYYY"),
        width: 200,
      },
      {
        title: "Thời gian",
        key: "time",
        render: (_: any, record: ListUserBookingHistoryResponse) => (
          <Space>
            <ClockCircleOutlined />
            <Text>
              {dayjs(record.startTime, "HH:mm:ss").format("HH:mm")} - {dayjs(record.endTime, "HH:mm:ss").format("HH:mm")}
            </Text>
          </Space>
        ),
        width: 200,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (status: string) => {
          const statusConfig = {
            Active: { color: "green", text: "Đã đặt & thanh toán" },
            PendingPayment: { color: "orange", text: "Chờ thanh toán" },
            Completed: { color: "blue", text: "Hoàn tất" },
            Cancelled: { color: "red", text: "Đã hủy" },
          } as const;
          const config = (statusConfig as any)[status] || { color: "default", text: status };
          return <Tag color={config.color}>{config.text}</Tag>;
        },
        width: 200,
      },
      {
        title: "Tổng tiền",
        key: "totalAmount",
        render: (_: any, record: ListUserBookingHistoryResponse) => (
          <Space>
            <DollarOutlined />
            <Text strong style={{ color: record.totalAmount && record.totalAmount > 0 ? "#52c41a" : "#8c8c8c" }}>
              {record.totalAmount && record.totalAmount > 0 ? `${record.totalAmount.toLocaleString("vi-VN")} đ` : "Chưa tính"}
            </Text>
          </Space>
        ),
        width: 200,
      },
      {
        title: "Đã trả",
        key: "paidAmount",
        render: (_: any, record: ListUserBookingHistoryResponse) => (
          <Space>
            <Text type="success">{record.paidAmount && record.paidAmount > 0 ? `${record.paidAmount.toLocaleString("vi-VN")} đ` : "0 đ"}</Text>
          </Space>
        ),
        width: 150,
      },
      {
        title: "Còn lại",
        key: "remainingAmount",
        render: (_: any, record: ListUserBookingHistoryResponse) => {
          if (!record.totalAmount || record.totalAmount === 0) {
            return <Text type="secondary">Chưa tính</Text>;
          }

          if (record.remainingAmount && record.remainingAmount === 0) {
            return <Tag color="green">Đã thanh toán đủ</Tag>;
          } else if (record.paidAmount && record.paidAmount > 0) {
            return (
              <Space direction="vertical" size={0}>
                <Text type="warning">{record.remainingAmount?.toLocaleString("vi-VN")} đ</Text>
              </Space>
            );
          } else {
            return <Tag color="orange">Chưa thanh toán</Tag>;
          }
        },
        width: 200,
      },
      {
        title: "Thao tác",
        key: "action",
        render: (_: any, record: ListUserBookingHistoryResponse) => {
          const isPendingPayment = record.status === "PendingPayment";
          const hasQrUrl = record.qrUrl && record.paymentId;

          return (
            <Space>
              <Button
                type="primary"
                icon={<QrcodeOutlined />}
                onClick={() => handleShowQrPayment(record)}
                size="small"
                disabled={!hasQrUrl || !isPendingPayment}
              >
                Mã QR
              </Button>
            </Space>
          );
        },
        width: 100,
        fixed: "right" as const,
      },
    ],
    [handleShowQrPayment],
  );

  const bookingHistory = useMemo(() => data?.data || [], [data?.data]);

  // Stable expandable renderer to avoid re-creating function on each render
  const expandedRowRender = useCallback(
    (record: ListUserBookingHistoryResponse) => (
      <div className="bg-gray-50 p-4">
        <BookingExpandableContent record={record} />
      </div>
    ),
    [],
  );

  const tablePagination = useMemo(
    () => ({
      pageSize: 10,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} của ${total} lần đặt sân`,
    }),
    [],
  );

  const renderContent = () => {
    switch (current) {
      case "booking-history":
        return (
          <div>
            <div className="mb-6">
              <Title level={2}>
                <CalendarOutlined className="mr-2" />
                Lịch sử đặt sân & Thanh toán
              </Title>
              <div className="flex items-center justify-between">
                <Text type="secondary">Danh sách các lần đặt sân của bạn</Text>
                <div className="flex items-center gap-2">
                  <Button size="middle" onClick={() => refetch()} loading={isFetching} icon={<ReloadOutlined />}>
                    Tải lại dữ liệu
                  </Button>
                  <Button
                    size="middle"
                    type="primary"
                    onClick={() => exportService.exportBookingHistory()}
                    loading={isFetching}
                    icon={<DownloadOutlined />}
                  >
                    Xuất file Excel
                  </Button>
                </div>
              </div>
            </div>

            {bookingHistory.length === 0 ? (
              <Empty description="Bạn chưa có lịch sử đặt sân nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                columns={columns}
                dataSource={bookingHistory}
                rowKey="id"
                pagination={tablePagination}
                bordered
                size="small"
                scroll={{ x: 800 }}
                expandable={{
                  expandedRowRender,
                  rowExpandable: () => true,
                }}
                rowHoverable
              />
            )}
          </div>
        );
      case "profile":
        return (
          <section>
            <div className="mb-6">
              <Title level={2}>
                <UserOutlined className="mr-2" />
                Thông tin cá nhân
              </Title>
              <Text type="secondary">Quản lý thông tin cá nhân của bạn</Text>
            </div>
            <ProfilePage />
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={items} />
      </div>

      {isLoading ? (
        <div className="flex min-h-96 items-center justify-center">
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert message="Lỗi tải dữ liệu" description="Không thể tải lịch sử đặt sân. Vui lòng thử lại sau." type="error" showIcon />
      ) : (
        renderContent()
      )}

      {/* QR Payment Drawer */}
      <QrPaymentDrawer
        bookingDetail={selectedBookingForQr ? convertToDetailBooking(selectedBookingForQr) : null}
        open={openQrDrawer}
        onClose={handleCloseQrDrawer}
        title="Thanh toán chuyển khoản"
        width={560}
        hideCustomerButton={true}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default BookingHistoryPage;
