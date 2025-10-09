"use client";

import { useDetailBookingCourt } from "@/hooks/useBookingCourt";
import { DetailBookingCourtResponse, PaymentDto } from "@/types-openapi/api";
import { Descriptions, Divider, Drawer, Tabs, Tag } from "antd";

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
  const { data, isFetching } = useDetailBookingCourt(bookingId ?? undefined);
  const bookingDetailData: DetailBookingCourtResponse = data?.data as DetailBookingCourtResponse;

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
                <div className="flex flex-col gap-16">
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
    </Drawer>
  );
}
