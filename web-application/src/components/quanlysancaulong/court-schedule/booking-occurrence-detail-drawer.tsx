"use client";

import {
  useDetailBookingCourtOccurrence,
  useCheckInBookingCourtOccurrence,
  useNoShowBookingCourtOccurrence,
  useCancelBookingCourtOccurrence,
} from "@/hooks/useBookingCourtOccurrence";
import { ApiError } from "@/lib/axios";
import { DetailBookingCourtOccurrenceResponse, PaymentDto } from "@/types-openapi/api";
import { BookingCourtOccurrenceStatus } from "@/types/commons";
import { ExclamationCircleTwoTone, QrcodeOutlined } from "@ant-design/icons";
import { Button, Descriptions, Divider, Drawer, Input, message, Modal, Tabs, Tag } from "antd";
import { CircleOffIcon, DoorClosedIcon, DoorOpenIcon, EyeIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import BookingDetailDrawer from "./booking-detail-drawer";
import QrPaymentDrawer from "./qr-payment-drawer";

const { confirm } = Modal;
const { TextArea } = Input;

interface BookingOccurrenceDetailDrawerProps {
  occurrenceId: string | null;
  open: boolean;
  onClose: () => void;
}

const vnOccurrenceStatus: Record<string, { color: string; text: string }> = {
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
    text: "Không đến",
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

export default function BookingOccurrenceDetailDrawer({ occurrenceId, open, onClose }: BookingOccurrenceDetailDrawerProps) {
  const { data, isFetching } = useDetailBookingCourtOccurrence({ id: occurrenceId ?? "" });
  const occurrenceDetailData: DetailBookingCourtOccurrenceResponse = data?.data as DetailBookingCourtOccurrenceResponse;
  const [openQrPayment, setOpenQrPayment] = useState(false);
  const [openBookingDetail, setOpenBookingDetail] = useState(false);

  const checkInMutation = useCheckInBookingCourtOccurrence();
  const noShowMutation = useNoShowBookingCourtOccurrence();
  const cancelOccurrenceMutation = useCancelBookingCourtOccurrence();

  const handleCheckIn = async () => {
    if (!occurrenceId) return;
    let noteValue = "";

    confirm({
      title: "Xác nhận",
      icon: <ExclamationCircleTwoTone />,
      okText: "Check-in",
      cancelText: "Bỏ qua",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn check-in lịch sân này?</p>
          <TextArea rows={3} placeholder="Ghi chú (nếu có)..." onChange={(e) => (noteValue = e.target.value)} />
        </div>
      ),
      async onOk() {
        await checkInMutation.mutateAsync(
          { id: occurrenceId, note: noteValue },
          {
            onError: (error: ApiError) => {
              message.error(error.message || "Check-in thất bại");
            },
            onSuccess: () => {
              message.success("Check-in thành công");
            },
          },
        );
      },
    });
  };

  const handleNoShow = async () => {
    if (!occurrenceId) return;
    try {
      let noteValue = "";

      confirm({
        title: "Xác nhận",
        icon: <ExclamationCircleTwoTone />,
        okText: "Đánh dấu No-show",
        cancelText: "Bỏ qua",
        content: (
          <div>
            <p>Bạn có chắc chắn muốn đánh dấu No-show lịch sân này?</p>
            <TextArea rows={3} placeholder="Ghi chú (nếu có)..." onChange={(e) => (noteValue = e.target.value)} />
          </div>
        ),
        async onOk() {
          await noShowMutation.mutateAsync({ id: occurrenceId, note: noteValue });
          message.success("Đã đánh dấu No-show");
        },
      });
    } catch (error: any) {
      message.error((error as ApiError)?.message || "Đánh dấu No-show thất bại");
    }
  };

  const handleCancelOccurrence = async () => {
    if (!occurrenceId) return;
    let noteValue = "";

    confirm({
      title: "Xác nhận hủy lịch sân",
      icon: <ExclamationCircleTwoTone />,
      okText: "Hủy lịch",
      cancelText: "Bỏ qua",
      okButtonProps: { danger: true },
      content: (
        <div>
          <p>Bạn có chắc chắn muốn hủy lịch sân này?</p>
          <TextArea rows={3} placeholder="Ghi chú (nếu có)..." onChange={(e) => (noteValue = e.target.value)} />
        </div>
      ),
      async onOk() {
        await cancelOccurrenceMutation.mutateAsync(
          { id: occurrenceId, note: noteValue },
          {
            onError: (error: ApiError) => {
              message.error(error.message || "Hủy lịch sân thất bại");
            },
            onSuccess: () => {
              message.success("Hủy lịch sân thành công");
            },
          },
        );
      },
    });
  };

  // Compute enable/disable by current time vs occurrence window for TODAY
  const now = new Date();
  const occursToday = (() => {
    if (!occurrenceDetailData) return false;
    const occurrenceDate = new Date(String(occurrenceDetailData.date));
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return (
      today.getFullYear() === occurrenceDate.getFullYear() &&
      today.getMonth() === occurrenceDate.getMonth() &&
      today.getDate() === occurrenceDate.getDate()
    );
  })();

  const startDateTime = (() => {
    if (!occurrenceDetailData || !occursToday) return null;
    const [sh, sm] = String(occurrenceDetailData.startTime).substring(0, 5).split(":");
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(sh || "0", 10), parseInt(sm || "0", 10), 0, 0);
    return dt;
  })();
  const endDateTime = (() => {
    if (!occurrenceDetailData || !occursToday) return null;
    const [eh, em] = String(occurrenceDetailData.endTime).substring(0, 5).split(":");
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
      occurrenceDetailData?.status === BookingCourtOccurrenceStatus.Active,
  );
  const canNoShow = Boolean(
    occursToday &&
      endDateTime &&
      now > endDateTime &&
      occurrenceDetailData &&
      occurrenceDetailData.status !== BookingCourtOccurrenceStatus.CheckedIn &&
      occurrenceDetailData.status !== BookingCourtOccurrenceStatus.Cancelled &&
      occurrenceDetailData.status !== BookingCourtOccurrenceStatus.Completed &&
      occurrenceDetailData.status !== BookingCourtOccurrenceStatus.NoShow,
  );

  const canCancelOccurrence = Boolean(
    occurrenceDetailData &&
      occurrenceDetailData.status !== BookingCourtOccurrenceStatus.Cancelled &&
      occurrenceDetailData.status !== BookingCourtOccurrenceStatus.Completed &&
      occurrenceDetailData.status !== BookingCourtOccurrenceStatus.CheckedIn,
  );

  const handleCallOrderOrCheckout = async () => {
    if (!occurrenceId) return;
    window.open(`/quanlysancaulong/cashier`, "_blank");
  };

  const handleViewBookingDetail = () => {
    if (occurrenceDetailData?.bookingCourtId) {
      setOpenBookingDetail(true);
    }
  };

  return (
    <>
      <Drawer title="Chi tiết lịch sân" placement="right" width={1000} open={open} onClose={onClose} destroyOnClose>
        {isFetching ? (
          <div>Đang tải...</div>
        ) : !occurrenceDetailData ? (
          <div>Không có dữ liệu</div>
        ) : (
          <Tabs
            defaultActiveKey="info"
            items={[
              {
                key: "info",
                label: "Thông tin lịch sân",
                children: (
                  <div className="flex flex-col gap-5">
                    <div className="flex justify-end gap-2">
                      <Button
                        icon={<EyeIcon className="h-4 w-4" />}
                        style={{ width: "185px", height: "40px" }}
                        onClick={handleViewBookingDetail}
                        type="default"
                      >
                        Xem đặt sân gốc
                      </Button>
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
                        type="default"
                        disabled={occurrenceDetailData.status !== BookingCourtOccurrenceStatus.CheckedIn}
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
                        icon={<XCircleIcon className="h-4 w-4" />}
                        style={{ width: "185px", height: "40px" }}
                        onClick={handleCancelOccurrence}
                        loading={cancelOccurrenceMutation.isPending}
                        danger
                        disabled={!canCancelOccurrence}
                      >
                        Hủy lịch
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
                            <Tag color={vnOccurrenceStatus[occurrenceDetailData.status ?? ""]?.color ?? "blue"}>
                              {vnOccurrenceStatus[occurrenceDetailData.status ?? ""]?.text ?? occurrenceDetailData.status}
                            </Tag>
                          ),
                          span: 1,
                        },
                        { key: "totalHours", label: "Tổng giờ", children: `${occurrenceDetailData.totalHours ?? 0}`, span: 1 },
                        { key: "customerName", label: "Tên khách hàng", children: occurrenceDetailData.customer?.fullName ?? "-", span: 1 },
                        { key: "courtName", label: "Tên sân", children: occurrenceDetailData.court?.name ?? "-", span: 1 },
                        {
                          key: "paymentType",
                          label: "Hình thức trả",
                          children:
                            occurrenceDetailData.paymentType === "Full"
                              ? "Thanh toán toàn bộ"
                              : occurrenceDetailData.paymentType === "Deposit"
                                ? "Đặt cọc"
                                : "-",
                          span: 1,
                        },
                        {
                          key: "totalAmount",
                          label: "Tổng tiền",
                          children: `${(occurrenceDetailData.totalAmount ?? 0).toLocaleString("vi-VN")} đ`,
                          span: 1,
                        },
                        {
                          key: "paidAmount",
                          label: "Đã thanh toán",
                          children: `${(occurrenceDetailData.paidAmount ?? 0).toLocaleString("vi-VN")} đ`,
                          span: 1,
                        },
                        {
                          key: "remainingAmount",
                          label: "Còn lại",
                          children: `${(occurrenceDetailData.remainingAmount ?? 0).toLocaleString("vi-VN")} đ`,
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
                              disabled={!occurrenceDetailData.qrUrl && !occurrenceDetailData.paymentId}
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
                          children: occurrenceDetailData.customer?.id ?? "-",
                          span: 1,
                        },
                        { key: "customerName2", label: "Tên khách hàng", children: occurrenceDetailData.customer?.fullName ?? "-", span: 1 },
                        { key: "phone", label: "Số điện thoại", children: occurrenceDetailData.customer?.phoneNumber ?? "-", span: 1 },
                        { key: "email", label: "Email", children: occurrenceDetailData.customer?.email ?? "-", span: 1 },
                      ]}
                    />

                    <Descriptions
                      bordered
                      size="small"
                      title="Thời gian lịch sân"
                      column={2}
                      items={[
                        { key: "date", label: "Ngày", children: String(occurrenceDetailData.date), span: 1 },
                        { key: "startTime", label: "Giờ bắt đầu", children: String(occurrenceDetailData.startTime), span: 1 },
                        { key: "endTime", label: "Giờ kết thúc", children: String(occurrenceDetailData.endTime), span: 1 },
                        { key: "note", label: "Ghi chú", children: occurrenceDetailData.note ?? "-", span: 1 },
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
                    {occurrenceDetailData.payments && occurrenceDetailData.payments.length > 0 ? (
                      <Descriptions
                        bordered
                        size="small"
                        column={1}
                        items={occurrenceDetailData.payments.map((p: PaymentDto, idx: number) => ({
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
                                  {
                                    key: "cname",
                                    label: "Tên KH",
                                    children: p.customerName ?? occurrenceDetailData.customer?.fullName ?? "-",
                                    span: 1,
                                  },
                                  {
                                    key: "cid",
                                    label: "Mã KH",
                                    children: p.customerId ?? occurrenceDetailData.customer?.id ?? "-",
                                    span: 1,
                                  },
                                  {
                                    key: "cphone",
                                    label: "SĐT",
                                    children: p.customerPhone ?? occurrenceDetailData.customer?.phoneNumber ?? "-",
                                    span: 1,
                                  },
                                  {
                                    key: "cemail",
                                    label: "Email",
                                    children: p.customerEmail ?? occurrenceDetailData.customer?.email ?? "-",
                                    span: 1,
                                  },
                                  { key: "cname2", label: "Tên sân", children: p.courtName ?? occurrenceDetailData.court?.name ?? "-", span: 2 },
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
          bookingDetail={occurrenceDetailData}
          open={openQrPayment}
          onClose={() => setOpenQrPayment(false)}
          title="Thông tin thanh toán"
          width={600}
        />
      </Drawer>

      {/* Booking Detail Drawer */}
      <BookingDetailDrawer
        bookingId={occurrenceDetailData?.bookingCourtId ?? null}
        open={openBookingDetail}
        onClose={() => setOpenBookingDetail(false)}
      />
    </>
  );
}
