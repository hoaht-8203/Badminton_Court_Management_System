"use client";

import { DetailBookingCourtResponse } from "@/types-openapi/api";
import { Button, Descriptions, Drawer, Image } from "antd";
import { useEffect, useState } from "react";

interface QrPaymentDrawerProps {
  bookingDetail: DetailBookingCourtResponse | null;
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number;
}

// Helper component for countdown
function CountdownBanner({ expiresAtUtc }: { expiresAtUtc: string }) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const expiry = new Date(expiresAtUtc).getTime();
    const tick = () => {
      const now = Date.now();
      const ms = Math.max(0, expiry - now);
      setRemaining(ms);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAtUtc]);

  return (
    <div
      style={{
        marginBottom: 12,
        padding: 8,
        border: "1px solid #fecaca",
        background: "#fef2f2",
        borderRadius: 6,
        color: "#b91c1c",
        fontWeight: 700,
      }}
    >
      Thời gian giữ chỗ còn lại: {formatRemaining(remaining)}
    </div>
  );
}

// Helper component for QR section with real-time expiry check
function QRSection({ bookingDetail }: { bookingDetail: DetailBookingCourtResponse | null }) {
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!bookingDetail?.expiresAtUtc) return;

    const expiry = new Date(bookingDetail.expiresAtUtc as any).getTime();
    const checkExpiry = () => {
      const now = Date.now();
      setIsExpired(now >= expiry);
    };

    checkExpiry();
    const id = setInterval(checkExpiry, 1000);
    return () => clearInterval(id);
  }, [bookingDetail?.expiresAtUtc]);

  if (isExpired) {
    return (
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <div
          style={{
            padding: "20px",
            background: "#fef2f2",
            borderRadius: "8px",
            border: "2px solid #dc2626",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "18px", color: "#dc2626", marginBottom: "12px" }}>QR Code đã hết hạn</div>
          <div style={{ fontSize: "16px", color: "#dc2626", fontWeight: "bold", marginBottom: "8px" }}>Không thể thanh toán</div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            <div>• Trạng thái đặt sân đã bị hủy</div>
            <div>• Trạng thái thanh toán đã bị hủy</div>
            <div>• Vui lòng đặt lại lịch mới cho khách hàng</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16, textAlign: "center" }}>
      {bookingDetail?.qrUrl ? <Image src={bookingDetail.qrUrl} alt="QR thanh toán" style={{ width: 280, height: 280 }} /> : <div>Không có QR</div>}
      <div style={{ marginTop: 8 }}>
        <span>Mã thanh toán: {bookingDetail?.paymentId ?? "-"}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <span>Số tiền: {(bookingDetail?.paymentAmount ?? 0).toLocaleString("vi-VN")} đ</span>
      </div>
      {bookingDetail?.expiresAtUtc && (
        <div style={{ marginTop: 8 }}>
          <span>Hết hạn lúc: {new Date(bookingDetail.expiresAtUtc as any).toLocaleString("vi-VN")}</span>
        </div>
      )}
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <Button
          type="primary"
          size="large"
          onClick={() => {
            const paymentUrl = `/payment/${bookingDetail?.id}`;
            window.open(paymentUrl, "_blank");
          }}
          style={{
            backgroundColor: "#1890ff",
            borderColor: "#1890ff",
            fontWeight: "bold",
            padding: "8px 24px",
            height: "auto",
          }}
        >
          Hiển thị thanh toán cho khách hàng
        </Button>
      </div>
    </div>
  );
}

function formatRemaining(ms: number) {
  if (!ms || ms <= 0) {
    return "Hết hạn";
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function QrPaymentDrawer({ bookingDetail, open, onClose, title = "Thanh toán chuyển khoản", width = 560 }: QrPaymentDrawerProps) {
  return (
    <Drawer title={title} width={width} open={open} onClose={onClose}>
      {/* Countdown until expiration */}
      {bookingDetail?.expiresAtUtc ? <CountdownBanner expiresAtUtc={bookingDetail.expiresAtUtc as any} /> : null}

      <Descriptions
        bordered
        size="small"
        title="Thông tin đặt sân"
        column={1}
        items={[
          {
            key: "type",
            label: "Loại",
            children: bookingDetail?.daysOfWeek && bookingDetail.daysOfWeek.length > 0 ? "Đặt lịch cố định" : "Đặt lịch vãng lai",
          },
          {
            key: "customer",
            label: "Khách hàng",
            children: bookingDetail?.customer?.fullName ?? "-",
          },
          {
            key: "phone",
            label: "SĐT",
            children: bookingDetail?.customer?.phoneNumber ?? "-",
          },
          {
            key: "court",
            label: "Sân",
            children: bookingDetail?.courtName ?? "-",
          },
          // Show single date for walk-in
          ...(bookingDetail?.daysOfWeek && bookingDetail.daysOfWeek.length > 0
            ? []
            : [
                {
                  key: "date",
                  label: "Ngày",
                  children: bookingDetail ? `${String(bookingDetail.startDate)}` : "-",
                },
              ]),
          // Show date range and days of week for fixed schedule
          ...(bookingDetail?.daysOfWeek && bookingDetail.daysOfWeek.length > 0
            ? [
                {
                  key: "range",
                  label: "Khoảng ngày",
                  children: bookingDetail ? `${String(bookingDetail.startDate)} - ${String(bookingDetail.endDate)}` : "-",
                },
                {
                  key: "daysOfWeek",
                  label: "Các ngày trong tuần",
                  children: bookingDetail?.daysOfWeek?.join(", ") ?? "-",
                },
              ]
            : []),
          {
            key: "time",
            label: "Thời gian",
            children: bookingDetail ? `${String(bookingDetail.startTime)} - ${String(bookingDetail.endTime)}` : "-",
          },
          {
            key: "amount",
            label: "Số tiền cần thanh toán",
            children: <span className="text-lg font-bold text-red-600">{`${(bookingDetail?.paymentAmount ?? 0).toLocaleString("vi-VN")} đ`}</span>,
          },
        ]}
      />

      <QRSection bookingDetail={bookingDetail} />
    </Drawer>
  );
}
