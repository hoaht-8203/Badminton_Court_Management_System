"use client";

import {
  useCancelBookingCourt,
  useCheckInBookingCourt,
  useCheckOutBookingCourt,
  useDetailBookingCourt,
  useNoShowBookingCourt,
} from "@/hooks/useBookingCourt";
import { ApiError } from "@/lib/axios";
import { DetailBookingCourtResponse, PaymentDto } from "@/types-openapi/api";
import { BookingCourtStatus } from "@/types/commons";
import { QrcodeOutlined } from "@ant-design/icons";
import { Button, Descriptions, Divider, Drawer, Input, message, Modal, Tabs, Tag } from "antd";
import { CircleOffIcon, DoorClosedIcon, DoorOpenIcon, TicketSlashIcon } from "lucide-react";
import { useState } from "react";
import QrPaymentDrawer from "./qr-payment-drawer";
import { ExclamationCircleTwoTone } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { confirm } = Modal;
const { TextArea } = Input;

interface BookingDetailDrawerProps {
  bookingId: string | null;
  open: boolean;
  onClose: () => void;
}

const vnBookingStatus: Record<string, { color: string; text: string }> = {
  PendingPayment: {
    color: "orange",
    text: "Đã đặt và chờ thanh toán",
  },
  Active: {
    color: "green",
    text: "Đã đặt và thanh toán",
  },
  Completed: {
    color: "blue",
    text: "Hoàn tất",
  },
  Cancelled: {
    color: "red",
    text: "Đã hủy",
  },
  CheckedIn: {
    color: "geekblue",
    text: "Đã check-in",
  },
  NoShow: {
    color: "volcano",
    text: "No-show",
  },
};

const vnPaymentStatus: Record<string, { color: string; text: string }> = {
  PendingPayment: {
    color: "orange",
    text: "Chờ thanh toán",
  },
  Unpaid: {
    color: "red",
    text: "Chưa thanh toán",
  },
  Paid: {
    color: "green",
    text: "Đã thanh toán",
  },
  Cancelled: {
    color: "red",
    text: "Đã hủy",
  },
};

export default function BookingDetailDrawer({ bookingId, open, onClose }: BookingDetailDrawerProps) {
  const router = useRouter();
  const [modal, contextHolder] = Modal.useModal();
  const { data, isFetching } = useDetailBookingCourt(bookingId ?? undefined);
  const bookingDetailData: DetailBookingCourtResponse = data?.data as DetailBookingCourtResponse;
  const [openQrPayment, setOpenQrPayment] = useState(false);
  const cancelMutation = useCancelBookingCourt();
  const checkInMutation = useCheckInBookingCourt();
  const checkOutMutation = useCheckOutBookingCourt();
  const noShowMutation = useNoShowBookingCourt();

  const handleCheckIn = async () => {
    if (!bookingId) return;
    try {
      let noteValue = "";

      confirm({
        title: "Xác nhận",
        icon: <ExclamationCircleTwoTone />,
        okText: "Check-in",
        cancelText: "Bỏ qua",
        okButtonProps: {
          loading: checkInMutation.isPending,
        },
        content: (
          <div>
            <p>Bạn có chắc chắn muốn check-in lịch đặt sân này?</p>
            <TextArea rows={3} placeholder="Ghi chú (nếu có)..." onChange={(e) => (noteValue = e.target.value)} />
          </div>
        ),
        async onOk() {
          await checkInMutation.mutateAsync({ id: bookingId, note: noteValue });
          message.success("Check-in thành công");
        },
      });
    } catch (error: any) {
      message.error((error as ApiError)?.message || "Check-in thất bại");
    }
  };

  const handleCheckOut = async () => {
    if (!bookingId) return;
    try {
      let noteValue = "";

      confirm({
        title: "Xác nhận",
        icon: <ExclamationCircleTwoTone />,
        okText: "Check-out",
        cancelText: "Bỏ qua",
        okButtonProps: {
          loading: checkOutMutation.isPending,
        },
        content: (
          <div>
            <p>Bạn có chắc chắn muốn check-out lịch đặt sân này?</p>
            <TextArea rows={3} placeholder="Ghi chú (nếu có)..." onChange={(e) => (noteValue = e.target.value)} />
          </div>
        ),
        async onOk() {
          await checkOutMutation.mutateAsync({ id: bookingId, note: noteValue });
          message.success("Check-out thành công");
        },
      });
    } catch (error: any) {
      message.error((error as ApiError)?.message || "Check-out thất bại");
    }
  };

  const handleNoShow = async () => {
    if (!bookingId) return;
    try {
      let noteValue = "";

      confirm({
        title: "Xác nhận",
        icon: <ExclamationCircleTwoTone />,
        okText: "Đánh dấu No-show",
        cancelText: "Bỏ qua",
        okButtonProps: {
          loading: noShowMutation.isPending,
        },
        content: (
          <div>
            <p>Bạn có chắc chắn muốn đánh dấu No-show lịch đặt sân này?</p>
            <TextArea rows={3} placeholder="Ghi chú (nếu có)..." onChange={(e) => (noteValue = e.target.value)} />
          </div>
        ),
        async onOk() {
          await noShowMutation.mutateAsync({ id: bookingId, note: noteValue });
          message.success("Đã đánh dấu No-show");
        },
      });
    } catch (error: any) {
      message.error((error as ApiError)?.message || "Đánh dấu No-show thất bại");
    }
  };

  // Compute enable/disable by current time vs booking window for TODAY
  const now = new Date();
  const occursToday = (() => {
    if (!bookingDetailData) return false;
    const startDate = new Date(String(bookingDetailData.startDate));
    const endDate = new Date(String(bookingDetailData.endDate));
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (bookingDetailData.daysOfWeek && bookingDetailData.daysOfWeek.length > 0) {
      if (today < new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) return false;
      if (today > new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())) return false;
      const jsDow = today.getDay();
      const customDow = jsDow === 0 ? 8 : jsDow + 1;
      return bookingDetailData.daysOfWeek.includes(customDow as any);
    }
    // walk-in: only the startDate day
    return today.getFullYear() === startDate.getFullYear() && today.getMonth() === startDate.getMonth() && today.getDate() === startDate.getDate();
  })();

  const startDateTime = (() => {
    if (!bookingDetailData || !occursToday) return null;
    const [sh, sm] = String(bookingDetailData.startTime).substring(0, 5).split(":");
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(sh || "0", 10), parseInt(sm || "0", 10), 0, 0);
    return dt;
  })();
  const endDateTime = (() => {
    if (!bookingDetailData || !occursToday) return null;
    const [eh, em] = String(bookingDetailData.endTime).substring(0, 5).split(":");
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(eh || "0", 10), parseInt(em || "0", 10), 0, 0);
    return dt;
  })();
  const earlyStart = startDateTime ? new Date(startDateTime.getTime() - 10 * 60 * 1000) : null;

  const canCheckIn = Boolean(
    occursToday &&
      startDateTime &&
      endDateTime &&
      earlyStart &&
      now >= earlyStart &&
      now <= endDateTime &&
      bookingDetailData?.status === BookingCourtStatus.Active,
  );
  const canNoShow = Boolean(
    occursToday &&
      endDateTime &&
      now > endDateTime &&
      bookingDetailData &&
      bookingDetailData.status !== BookingCourtStatus.CheckedIn &&
      bookingDetailData.status !== BookingCourtStatus.Cancelled &&
      bookingDetailData.status !== BookingCourtStatus.Completed &&
      bookingDetailData.status !== BookingCourtStatus.NoShow,
  );

  const handleCallOrderOrCheckout = async () => {
    if (!bookingId) return;
    window.open(`/quanlysancaulong/cashier?bookingId=${bookingId}`, "_blank");
  };

  return (
    <Drawer title="Chi tiết đặt sân" placement="right" width={1000} open={open} onClose={onClose} destroyOnClose>
      {isFetching ? (
        <div>Đang tải...</div>
      ) : !bookingDetailData ? (
        <div>Không có dữ liệu</div>
      ) : (
        <Tabs
          defaultActiveKey="info"
          items={[
            {
              key: "info",
              label: "Thông tin đặt sân",
              children: (
                <div className="flex flex-col gap-5">
                  <div className="flex justify-end gap-2">
                    <Button
                      icon={<DoorOpenIcon className="h-4 w-4" />}
                      style={{ width: "185px", height: "40px" }}
                      onClick={handleCheckIn}
                      loading={checkInMutation.isPending}
                      type="primary"
                      disabled={!canCheckIn}
                    >
                      Check-in
                    </Button>
                    <Button
                      icon={<DoorClosedIcon className="h-4 w-4" />}
                      style={{ width: "185px", height: "40px" }}
                      onClick={handleCallOrderOrCheckout}
                      loading={checkOutMutation.isPending}
                      type="default"
                      disabled={bookingDetailData.status !== BookingCourtStatus.CheckedIn}
                    >
                      Gọi món | Check-out
                    </Button>
                    <Button
                      icon={<CircleOffIcon className="h-4 w-4" />}
                      style={{ width: "185px", height: "40px" }}
                      onClick={handleNoShow}
                      loading={noShowMutation.isPending}
                      danger
                      type="dashed"
                      disabled={!canNoShow}
                    >
                      Không đến
                    </Button>
                    <Button
                      icon={<TicketSlashIcon className="h-4 w-4" />}
                      danger
                      style={{ width: "185px", height: "40px" }}
                      disabled={
                        bookingDetailData.status === BookingCourtStatus.Cancelled || bookingDetailData.status === BookingCourtStatus.Completed
                      }
                      onClick={async () => {
                        if (!bookingId) return;
                        modal.confirm({
                          title: "Xác nhận",
                          content: "Bạn có chắc chắn muốn huỷ lịch đặt sân này? Tiền cọc (nếu có) sẽ không được hoàn lại.",
                          okButtonProps: {
                            loading: cancelMutation.isPending,
                          },
                          onOk: async () => {
                            await cancelMutation.mutateAsync({ id: bookingId });
                            onClose();
                          },
                          okText: "Huỷ lịch đặt sân",
                          cancelText: "Bỏ qua",
                        });
                      }}
                      loading={cancelMutation.isPending}
                    >
                      Huỷ lịch đặt sân
                    </Button>
                  </div>
                  <Descriptions
                    bordered
                    size="small"
                    title="Thông tin cơ bản"
                    column={2}
                    items={[
                      {
                        key: "status",
                        label: "Trạng thái",
                        children: (
                          <Tag color={vnBookingStatus[bookingDetailData.status ?? ""]?.color ?? "blue"}>
                            {vnBookingStatus[bookingDetailData.status ?? ""]?.text ?? bookingDetailData.status}
                          </Tag>
                        ),
                        span: 1,
                      },
                      { key: "totalHours", label: "Tổng giờ", children: `${bookingDetailData.totalHours ?? 0}`, span: 1 },
                      { key: "customerName", label: "Tên khách hàng", children: bookingDetailData.customer?.fullName ?? "-", span: 1 },
                      { key: "courtName", label: "Tên sân", children: bookingDetailData.courtName ?? "-", span: 1 },
                      {
                        key: "paymentType",
                        label: "Hình thức trả",
                        children:
                          bookingDetailData.paymentType === "Full"
                            ? "Thanh toán toàn bộ"
                            : bookingDetailData.paymentType === "Deposit"
                              ? "Đặt cọc"
                              : "-",
                        span: 1,
                      },
                      {
                        key: "totalAmount",
                        label: "Tổng tiền",
                        children: `${(bookingDetailData.totalAmount ?? 0).toLocaleString("vi-VN")} đ`,
                        span: 1,
                      },
                      {
                        key: "paidAmount",
                        label: "Đã thanh toán",
                        children: `${(bookingDetailData.paidAmount ?? 0).toLocaleString("vi-VN")} đ`,
                        span: 1,
                      },
                      {
                        key: "remainingAmount",
                        label: "Còn lại",
                        children: `${(bookingDetailData.remainingAmount ?? 0).toLocaleString("vi-VN")} đ`,
                        span: 1,
                      },
                      {
                        key: "viewPayment",
                        label: "Thanh toán",
                        children: (
                          <Button
                            type="primary"
                            icon={<QrcodeOutlined />}
                            onClick={() => setOpenQrPayment(true)}
                            disabled={!bookingDetailData.qrUrl && !bookingDetailData.paymentId}
                          >
                            Xem QR thanh toán
                          </Button>
                        ),
                        span: 2,
                      },
                    ]}
                  />

                  <Descriptions
                    bordered
                    size="small"
                    title="Thông tin khách hàng"
                    column={2}
                    items={[
                      {
                        key: "customerId",
                        label: "Mã khách hàng",
                        children: bookingDetailData.customer?.id ?? bookingDetailData.customerId,
                        span: 1,
                      },
                      { key: "customerName2", label: "Tên khách hàng", children: bookingDetailData.customer?.fullName ?? "-", span: 1 },
                      { key: "phone", label: "Số điện thoại", children: bookingDetailData.customer?.phoneNumber ?? "-", span: 1 },
                      { key: "email", label: "Email", children: bookingDetailData.customer?.email ?? "-", span: 1 },
                    ]}
                  />

                  <Descriptions
                    bordered
                    size="small"
                    title="Thời gian đặt"
                    column={2}
                    items={[
                      { key: "startDate", label: "Ngày bắt đầu", children: String(bookingDetailData.startDate), span: 1 },
                      { key: "endDate", label: "Ngày kết thúc", children: String(bookingDetailData.endDate), span: 1 },
                      { key: "startTime", label: "Giờ bắt đầu", children: String(bookingDetailData.startTime), span: 1 },
                      { key: "endTime", label: "Giờ kết thúc", children: String(bookingDetailData.endTime), span: 1 },
                    ]}
                  />

                  <Descriptions
                    bordered
                    size="small"
                    title="Ngày trong tuần"
                    column={1}
                    items={[
                      {
                        key: "bookingType",
                        label: "Loại",
                        children: bookingDetailData.daysOfWeek && bookingDetailData.daysOfWeek.length > 0 ? "Cố định" : "Vãng lai",
                      },
                      {
                        key: "daysOfWeek",
                        label: "Các ngày",
                        children:
                          bookingDetailData.daysOfWeek && bookingDetailData.daysOfWeek.length > 0 ? bookingDetailData.daysOfWeek.join(", ") : "-",
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: "payments",
              label: "Lịch sử thanh toán",
              children: (
                <div>
                  <Divider orientation="left">Lịch sử thanh toán</Divider>
                  {bookingDetailData.payments && bookingDetailData.payments.length > 0 ? (
                    <Descriptions
                      bordered
                      size="small"
                      column={1}
                      items={bookingDetailData.payments.map((p: PaymentDto, idx: number) => ({
                        key: String(idx),
                        label: null,
                        children: (
                          <div className="flex flex-col gap-4">
                            <Descriptions
                              size="small"
                              column={2}
                              items={[
                                { key: "pid", label: "Mã thanh toán", children: p.id, span: 1 },
                                { key: "bid", label: "Mã đặt sân", children: String(p.bookingId), span: 1 },
                                { key: "amount", label: "Số tiền", children: `${(p.amount ?? 0).toLocaleString("vi-VN")} đ`, span: 1 },
                                {
                                  key: "pstatus",
                                  label: "Trạng thái",
                                  children: (
                                    <Tag color={vnPaymentStatus[p.status ?? ""]?.color ?? "blue"}>
                                      {vnPaymentStatus[p.status ?? ""]?.text ?? p.status}
                                    </Tag>
                                  ),
                                  span: 1,
                                },
                                { key: "cname", label: "Tên KH", children: p.customerName ?? bookingDetailData.customer?.fullName ?? "-", span: 1 },
                                {
                                  key: "cid",
                                  label: "Mã KH",
                                  children: p.customerId ?? bookingDetailData.customer?.id ?? bookingDetailData.customerId,
                                  span: 1,
                                },
                                { key: "cphone", label: "SĐT", children: p.customerPhone ?? bookingDetailData.customer?.phoneNumber ?? "-", span: 1 },
                                { key: "cemail", label: "Email", children: p.customerEmail ?? bookingDetailData.customer?.email ?? "-", span: 1 },
                                { key: "cname2", label: "Tên sân", children: p.courtName ?? bookingDetailData.courtName ?? "-", span: 2 },
                                {
                                  key: "pdate",
                                  label: "Ngày thanh toán",
                                  children: p.paymentCreatedAt ? new Date(p.paymentCreatedAt).toLocaleString("vi-VN") : "-",
                                  span: 2,
                                },
                                { key: "note", label: "Ghi chú", children: p.note ?? "-", span: 2 },
                              ]}
                            />
                          </div>
                        ),
                      }))}
                    />
                  ) : (
                    <div>Chưa có thanh toán</div>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      {/* QR Payment Drawer */}
      <QrPaymentDrawer
        bookingDetail={bookingDetailData}
        open={openQrPayment}
        onClose={() => setOpenQrPayment(false)}
        title="Thông tin thanh toán"
        width={600}
      />
      {contextHolder}
    </Drawer>
  );
}
