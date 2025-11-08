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
  CrownOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import "./membership-cards.css";
import type { MenuProps } from "antd";
import { Alert, Empty, Menu, Space, Spin, Table, Tag, Typography, Button, Modal, message } from "antd";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { exportService } from "@/services/exportService";
import { DownloadOutlined } from "@ant-design/icons";
import QrPaymentDrawer from "@/components/quanlysancaulong/court-schedule/qr-payment-drawer";
import MembershipQrPaymentDrawer from "@/components/quanlysancaulong/memberships/membership-qr-payment-drawer";
import { useAuth } from "@/context/AuthContext";
import { useListMemberships } from "@/hooks/useMembership";
import { useCreateUserMembershipForCurrentUser } from "@/hooks/useUserMembershipService";
import { ListMembershipResponse, CreateUserMembershipResponse } from "@/types-openapi/api";
import Image from "next/image";

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
  {
    label: "Hội viên",
    key: "membership",
    icon: <CrownOutlined />,
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
  const { user, refresh: refreshUser } = useAuth();
  const { data: membershipsData, isLoading: loadingMemberships } = useListMemberships({});
  const createMembershipMutation = useCreateUserMembershipForCurrentUser();
  const [openMembershipQrDrawer, setOpenMembershipQrDrawer] = useState(false);
  const [selectedMembershipPayment, setSelectedMembershipPayment] = useState<CreateUserMembershipResponse | null>(null);

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

  const handleRegisterMembership = useCallback(
    (membership: ListMembershipResponse) => {
      if (!membership.id) return;

      Modal.confirm({
        title: "Xác nhận đăng ký gói hội viên",
        content: (
          <div>
            <p>Bạn có chắc chắn muốn đăng ký gói hội viên:</p>
            <p>
              <strong>{membership.name}</strong>
            </p>
            <p>Giá: {membership.price?.toLocaleString("vi-VN")} đ</p>
            <p>Thời hạn: {membership.durationDays} ngày</p>
            <p className="text-orange-500">Lưu ý: Thanh toán bằng chuyển khoản</p>
          </div>
        ),
        okText: "Đăng ký",
        cancelText: "Hủy",
        onOk: async () => {
          try {
            const result = await createMembershipMutation.mutateAsync({
              membershipId: membership.id!,
            });

            if (result.data) {
              message.success("Đăng ký gói hội viên thành công!");
              refreshUser();

              // If payment method is Bank and has QR, show QR drawer
              if (result.data.qrUrl && result.data.paymentMethod === "Bank") {
                setSelectedMembershipPayment(result.data);
                setOpenMembershipQrDrawer(true);
              }
            }
          } catch (error: any) {
            message.error(error?.message || "Đăng ký gói hội viên thất bại!");
          }
        },
      });
    },
    [createMembershipMutation, refreshUser],
  );

  const handleCloseMembershipQrDrawer = useCallback(() => {
    setOpenMembershipQrDrawer(false);
    setSelectedMembershipPayment(null);
    refreshUser();
  }, [refreshUser]);

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
      case "membership":
        const currentMembership = user?.membership;
        const availableMemberships = membershipsData?.data?.filter((m) => m.status === "Active") || [];

        return (
          <section>
            <div className="mb-6">
              <Title level={2}>
                <CrownOutlined className="mr-2" />
                Quản lý hội viên
              </Title>
              <Text type="secondary">Thông tin gói hội viên của bạn</Text>
            </div>

            {currentMembership ? (
              <div className="current-membership-card-wrapper">
                {(() => {
                  // Determine level based on membership name or use default
                  const membershipName = currentMembership.membershipName?.toLowerCase() || "";
                  let level = 2; // Default to gold
                  if (membershipName.includes("silver")) level = 1;
                  else if (membershipName.includes("gold")) level = 2;
                  else if (membershipName.includes("platinum")) level = 3;

                  const getLogoPath = (level: number) => {
                    switch (level) {
                      case 1:
                        return "/membership-logo/silver-1.png";
                      case 2:
                        return "/membership-logo/gold-1.png";
                      case 3:
                      case 4:
                        return "/membership-logo/platinum-1.png";
                      default:
                        return "/membership-logo/gold-1.png";
                    }
                  };

                  const isExpired = currentMembership.endDate && dayjs(currentMembership.endDate).isBefore(dayjs());
                  const isActive = currentMembership.isActive && !isExpired;
                  const isPaid = currentMembership.status === "Paid";

                  return (
                    <div className={`current-membership-card current-membership-card-level-${level}`}>
                      <div className="current-membership-card-header">
                        <div className="current-membership-card-status-badge">
                          {isActive ? "Đang hoạt động" : isExpired ? "Đã hết hạn" : "Chưa kích hoạt"}
                        </div>
                        <Image
                          src={getLogoPath(level)}
                          alt={currentMembership.membershipName || "Membership logo"}
                          width={100}
                          height={100}
                          className="current-membership-card-logo"
                          unoptimized
                        />
                        <h3 className="current-membership-card-title">{currentMembership.membershipName || "N/A"}</h3>
                        {isPaid && (
                          <div className="current-membership-card-paid-badge">
                            <CheckCircleOutlined /> Đã thanh toán
                          </div>
                        )}
                      </div>

                      <div className="current-membership-card-body">
                        <div className="current-membership-card-info-grid">
                          {currentMembership.startDate && (
                            <div className="current-membership-card-info-item">
                              <CalendarOutlined className="current-membership-card-info-icon" />
                              <div className="current-membership-card-info-content">
                                <div className="current-membership-card-info-label">Ngày bắt đầu</div>
                                <div className="current-membership-card-info-value">{dayjs(currentMembership.startDate).format("DD/MM/YYYY")}</div>
                              </div>
                            </div>
                          )}
                          {currentMembership.endDate && (
                            <div className="current-membership-card-info-item">
                              <CalendarOutlined className="current-membership-card-info-icon" />
                              <div className="current-membership-card-info-content">
                                <div className="current-membership-card-info-label">Ngày kết thúc</div>
                                <div className="current-membership-card-info-value">{dayjs(currentMembership.endDate).format("DD/MM/YYYY")}</div>
                              </div>
                            </div>
                          )}
                          {currentMembership.startDate && currentMembership.endDate && (
                            <div className="current-membership-card-info-item">
                              <ClockCircleOutlined className="current-membership-card-info-icon" />
                              <div className="current-membership-card-info-content">
                                <div className="current-membership-card-info-label">Thời hạn còn lại</div>
                                <div className="current-membership-card-info-value">
                                  {isExpired ? (
                                    <span style={{ color: "#ff4d4f" }}>Đã hết hạn</span>
                                  ) : (
                                    <span>{dayjs(currentMembership.endDate).diff(dayjs(), "day")} ngày</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="current-membership-card-info-item">
                            <CrownOutlined className="current-membership-card-info-icon" />
                            <div className="current-membership-card-info-content">
                              <div className="current-membership-card-info-label">Trạng thái</div>
                              <div className="current-membership-card-info-value">
                                {isActive ? (
                                  <span style={{ color: "#52c41a", fontWeight: 600 }}>Đang hoạt động</span>
                                ) : isExpired ? (
                                  <span style={{ color: "#ff4d4f", fontWeight: 600 }}>Đã hết hạn</span>
                                ) : (
                                  <span style={{ color: "#faad14", fontWeight: 600 }}>Chưa kích hoạt</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {isExpired && (
                          <div className="current-membership-card-expired-alert">
                            <Alert
                              message="Gói hội viên đã hết hạn"
                              description="Bạn có thể đăng ký gói hội viên mới bên dưới"
                              type="warning"
                              showIcon
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <Alert
                message="Bạn chưa có gói hội viên"
                description="Vui lòng chọn một gói hội viên bên dưới để đăng ký"
                type="info"
                showIcon
                className="!mb-6"
              />
            )}

            <div className="mb-6">
              <Title level={3}>Danh sách gói hội viên</Title>
              {loadingMemberships ? (
                <div className="flex items-center justify-center py-12">
                  <Spin size="large" />
                </div>
              ) : availableMemberships.length === 0 ? (
                <Empty description="Không có gói hội viên nào khả dụng" />
              ) : (
                <div className="membership-cards-container">
                  {availableMemberships.map((membership, index) => {
                    // Determine level based on index (can be changed to price-based logic)
                    const totalMemberships = availableMemberships.length;
                    let level = 1;
                    if (totalMemberships === 1) {
                      level = 2;
                    } else if (totalMemberships === 2) {
                      level = index === 0 ? 1 : 3;
                    } else if (totalMemberships === 3) {
                      level = index === 0 ? 1 : index === 1 ? 2 : 3;
                    } else {
                      // 4+ memberships: distribute levels
                      const levelMap = [1, 2, 3, 4];
                      level = levelMap[Math.min(index, 3)];
                    }

                    const isPopular = index === Math.floor(totalMemberships / 2); // Middle card is popular
                    const isDisabled = !!currentMembership && currentMembership.isActive && dayjs(currentMembership.endDate).isAfter(dayjs());

                    // Map level to logo
                    const getLogoPath = (level: number) => {
                      switch (level) {
                        case 1:
                          return "/membership-logo/silver-1.png";
                        case 2:
                          return "/membership-logo/gold-1.png";
                        case 3:
                        case 4:
                          return "/membership-logo/platinum-1.png";
                        default:
                          return "/membership-logo/gold-1.png";
                      }
                    };

                    return (
                      <div
                        key={membership.id}
                        className={`membership-card membership-card-level-${level} ${isPopular ? "membership-card-popular" : ""}`}
                      >
                        <div className="membership-card-header">
                          <div className="membership-card-status">{membership.status === "Active" ? "Đang hoạt động" : membership.status}</div>
                          <Image
                            src={getLogoPath(level)}
                            alt={membership.name || "Membership logo"}
                            width={80}
                            height={80}
                            className="membership-card-logo"
                            unoptimized
                          />
                          <h3 className="membership-card-title">{membership.name}</h3>
                        </div>

                        <div className="membership-card-body">
                          {membership.description && <p className="membership-card-description">{membership.description}</p>}

                          <div className="membership-card-price-section">
                            <div className="membership-card-price-label">Giá gói</div>
                            <div className="membership-card-price-value">
                              {membership.price?.toLocaleString("vi-VN")}
                              <span className="membership-card-price-currency">đ</span>
                            </div>
                          </div>

                          <ul className="membership-card-features">
                            <li className="membership-card-feature">
                              <CheckCircleOutlined className="membership-card-feature-icon" />
                              <span className="membership-card-feature-text">
                                Thời hạn: <span className="membership-card-feature-value">{membership.durationDays} ngày</span>
                              </span>
                            </li>
                            {membership.discountPercent && membership.discountPercent > 0 && (
                              <li className="membership-card-feature">
                                <CheckCircleOutlined className="membership-card-feature-icon" />
                                <span className="membership-card-feature-text">
                                  Giảm giá: <span className="membership-card-feature-value">{membership.discountPercent}%</span> khi đặt sân
                                </span>
                              </li>
                            )}
                            <li className="membership-card-feature">
                              <CheckCircleOutlined className="membership-card-feature-icon" />
                              <span className="membership-card-feature-text">Thanh toán bằng chuyển khoản</span>
                            </li>
                          </ul>

                          {membership.discountPercent && membership.discountPercent > 0 && (
                            <div className="membership-card-discount">🎉 Giảm {membership.discountPercent}% khi đặt sân</div>
                          )}

                          <button
                            type="button"
                            className="membership-card-action"
                            onClick={() => handleRegisterMembership(membership)}
                            disabled={isDisabled || createMembershipMutation.isPending}
                          >
                            {createMembershipMutation.isPending ? (
                              <span>
                                <Spin size="small" style={{ marginRight: 8 }} />
                                Đang xử lý...
                              </span>
                            ) : isDisabled ? (
                              "Đã có gói"
                            ) : (
                              "Đăng ký ngay"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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

      {/* QR Payment Drawer for Booking */}
      <QrPaymentDrawer
        bookingDetail={selectedBookingForQr ? convertToDetailBooking(selectedBookingForQr) : null}
        open={openQrDrawer}
        onClose={handleCloseQrDrawer}
        title="Thanh toán chuyển khoản"
        width={560}
        hideCustomerButton={true}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* QR Payment Drawer for Membership */}
      <MembershipQrPaymentDrawer
        detail={selectedMembershipPayment}
        open={openMembershipQrDrawer}
        onClose={handleCloseMembershipQrDrawer}
        onPaymentSuccess={() => {
          refreshUser();
        }}
        title="Thanh toán gói hội viên"
        width={480}
      />
    </div>
  );
};

export default BookingHistoryPage;
