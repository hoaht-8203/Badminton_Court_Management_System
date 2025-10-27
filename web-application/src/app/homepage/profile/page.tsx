"use client";

import ProfilePage from "@/components/homepage/ProfilePage";
import { useGetUserBookingHistory } from "@/hooks/useSchedule";
import { ListUserBookingHistoryResponse, BookingCourtOccurrenceDto, PaymentDto } from "@/types-openapi/api";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  HistoryOutlined,
  UserOutlined,
  CreditCardOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Alert, Empty, Menu, Space, Spin, Table, Tag, Typography, Tabs, Card, Descriptions, List } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

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

const BookingHistoryPage = () => {
  const [current, setCurrent] = useState("profile");
  const { data, isLoading, error } = useGetUserBookingHistory();

  const onClick: MenuProps["onClick"] = (e) => {
    console.log("click ", e);
    setCurrent(e.key);
  };

  const columns = [
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
        };
        const config = statusConfig[status as keyof typeof statusConfig] || { color: "default", text: status };
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
      width: 200,
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
  ];

  const bookingHistory = data?.data || [];

  // Combine all payments from booking and occurrences, remove duplicates by ID
  const getAllPayments = (record: ListUserBookingHistoryResponse): PaymentDto[] => {
    const bookingPayments = record.payments || [];
    const occurrencePayments = record.bookingCourtOccurrences?.flatMap((occ) => occ.payments || []) || [];
    const allPayments = [...bookingPayments, ...occurrencePayments];

    // Remove duplicates by ID
    const uniquePayments = allPayments.filter((payment, index, self) => index === self.findIndex((p) => p.id === payment.id));

    return uniquePayments;
  };

  // Sort occurrences by date
  const getSortedOccurrences = (record: ListUserBookingHistoryResponse): BookingCourtOccurrenceDto[] => {
    return (record.bookingCourtOccurrences || []).sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  };

  // Render booking details tab
  const renderBookingDetails = (record: ListUserBookingHistoryResponse) => (
    <div className="space-y-4">
      <Card title="Thông tin đặt sân" size="small" className="!mb-2">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Sân">{record.courtName}</Descriptions.Item>
          <Descriptions.Item label="Khách hàng">{record.customerName}</Descriptions.Item>
          <Descriptions.Item label="Ngày bắt đầu">{dayjs(record.startDate).format("DD/MM/YYYY")}</Descriptions.Item>
          <Descriptions.Item label="Ngày kết thúc">{dayjs(record.endDate).format("DD/MM/YYYY")}</Descriptions.Item>
          <Descriptions.Item label="Thời gian">
            {dayjs(record.startTime, "HH:mm:ss").format("HH:mm")} - {dayjs(record.endTime, "HH:mm:ss").format("HH:mm")}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng giờ">{record.totalHours} giờ</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={record.status === "Active" ? "green" : record.status === "PendingPayment" ? "orange" : "default"}>
              {record.status === "Active" ? "Đã đặt & thanh toán" : record.status === "PendingPayment" ? "Chờ thanh toán" : record.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tổng tiền">
            <Text strong style={{ color: "#52c41a" }}>
              {record.totalAmount ? `${record.totalAmount.toLocaleString("vi-VN")} đ` : "Chưa tính"}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Chi tiết các lần sử dụng sân" size="small">
        <List
          dataSource={getSortedOccurrences(record)}
          renderItem={(occurrence, index) => (
            <List.Item>
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <Space>
                    <Text strong style={{ color: "#1890ff", minWidth: "60px" }}>
                      Buổi {index + 1}
                    </Text>
                    <CalendarOutlined />
                    <Text strong>{dayjs(occurrence.date).format("DD/MM/YYYY")}</Text>
                  </Space>
                  <Space>
                    <ClockCircleOutlined />
                    <Text>
                      {dayjs(occurrence.startTime, "HH:mm:ss").format("HH:mm")} - {dayjs(occurrence.endTime, "HH:mm:ss").format("HH:mm")}
                    </Text>
                  </Space>
                  <Tag
                    color={
                      occurrence.status === "Active"
                        ? "green"
                        : occurrence.status === "CheckedIn"
                          ? "blue"
                          : occurrence.status === "Completed"
                            ? "green"
                            : occurrence.status === "NoShow"
                              ? "red"
                              : occurrence.status === "Cancelled"
                                ? "red"
                                : "default"
                    }
                  >
                    {occurrence.status === "Active"
                      ? "Đã đặt"
                      : occurrence.status === "CheckedIn"
                        ? "Đang sử dụng"
                        : occurrence.status === "Completed"
                          ? "Hoàn tất"
                          : occurrence.status === "NoShow"
                            ? "Không đến"
                            : occurrence.status === "Cancelled"
                              ? "Đã hủy"
                              : occurrence.status}
                  </Tag>
                </div>
                {occurrence.note && (
                  <div className="mt-2">
                    <Text type="secondary">Ghi chú: {occurrence.note}</Text>
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  // Render payment history tab
  const renderPaymentHistory = (record: ListUserBookingHistoryResponse) => {
    const allPayments = getAllPayments(record);

    return (
      <div className="space-y-4">
        <Card title="Tổng quan thanh toán" size="small" className="!mb-2">
          <Descriptions column={3} size="small">
            <Descriptions.Item label="Tổng tiền">
              <Text strong style={{ color: "#52c41a" }}>
                {record.totalAmount ? `${record.totalAmount.toLocaleString("vi-VN")} đ` : "Chưa tính"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Đã trả">
              <Text type="success">{record.paidAmount ? `${record.paidAmount.toLocaleString("vi-VN")} đ` : "0 đ"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Còn lại">
              <Text type="warning">{record.remainingAmount ? `${record.remainingAmount.toLocaleString("vi-VN")} đ` : "0 đ"}</Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Lịch sử thanh toán" size="small">
          <List
            dataSource={allPayments}
            renderItem={(payment) => (
              <List.Item>
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <Space>
                      <CreditCardOutlined />
                      <Text strong>{payment.id}</Text>
                    </Space>
                    <Space>
                      <Text strong style={{ color: "#52c41a" }}>
                        {payment.amount ? `${payment.amount.toLocaleString("vi-VN")} đ` : "0 đ"}
                      </Text>
                      <Tag
                        color={
                          payment.status === "Paid"
                            ? "green"
                            : payment.status === "PendingPayment"
                              ? "orange"
                              : payment.status === "Cancelled"
                                ? "red"
                                : "default"
                        }
                      >
                        {payment.status === "Paid"
                          ? "Đã thanh toán"
                          : payment.status === "PendingPayment"
                            ? "Chờ thanh toán"
                            : payment.status === "Cancelled"
                              ? "Đã hủy"
                              : payment.status}
                      </Tag>
                    </Space>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <Text type="secondary">Ngày tạo: {dayjs(payment.paymentCreatedAt).format("DD/MM/YYYY HH:mm")}</Text>
                    {payment.note && <Text type="secondary">Ghi chú: {payment.note}</Text>}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>
    );
  };

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
              <Text type="secondary">Danh sách các lần đặt sân của bạn</Text>
            </div>

            {bookingHistory.length === 0 ? (
              <Empty description="Bạn chưa có lịch sử đặt sân nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                columns={columns}
                dataSource={bookingHistory}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} lần đặt sân`,
                }}
                bordered
                size="small"
                scroll={{ x: 800 }}
                expandable={{
                  expandedRowRender: (record) => (
                    <div className="bg-gray-50 p-4">
                      <Tabs
                        items={[
                          {
                            key: "details",
                            label: (
                              <span>
                                <InfoCircleOutlined className="mr-2" />
                                Chi tiết đặt sân
                              </span>
                            ),
                            children: renderBookingDetails(record),
                          },
                          {
                            key: "payments",
                            label: (
                              <span>
                                <CreditCardOutlined className="mr-2" />
                                Lịch sử thanh toán
                              </span>
                            ),
                            children: renderPaymentHistory(record),
                          },
                        ]}
                      />
                    </div>
                  ),
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
    </div>
  );
};

export default BookingHistoryPage;
