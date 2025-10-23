"use client";

import { CheckoutResponse } from "@/types-openapi/api";
import { Button, Descriptions, Drawer, Image } from "antd";
import { useEffect, useState } from "react";

interface CheckoutQrDrawerProps {
  checkoutDetail: CheckoutResponse | null;
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
function QRSection({ checkoutDetail }: { checkoutDetail: CheckoutResponse | null }) {
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!checkoutDetail?.expiresAtUtc) return;

    const expiry = new Date(checkoutDetail.expiresAtUtc as any).getTime();
    const checkExpiry = () => {
      const now = Date.now();
      setIsExpired(now >= expiry);
    };

    checkExpiry();
    const id = setInterval(checkExpiry, 1000);
    return () => clearInterval(id);
  }, [checkoutDetail?.expiresAtUtc]);

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
      {checkoutDetail?.qrUrl ? <Image src={checkoutDetail.qrUrl} alt="QR thanh toán" style={{ width: 280, height: 280 }} /> : <div>Không có QR</div>}
      <div style={{ marginTop: 8 }}>
        <span>Mã thanh toán: {checkoutDetail?.paymentId ?? "-"}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <span>Số tiền: {(checkoutDetail?.paymentAmount ?? 0).toLocaleString("vi-VN")} đ</span>
      </div>
      {checkoutDetail?.expiresAtUtc && (
        <div style={{ marginTop: 8 }}>
          <span>Hết hạn lúc: {new Date(checkoutDetail.expiresAtUtc as any).toLocaleString("vi-VN")}</span>
        </div>
      )}
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <Button
          type="primary"
          size="large"
          onClick={() => {
            const paymentUrl = `/checkout/${checkoutDetail?.orderId}`;
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

export default function CheckoutQrDrawer({ checkoutDetail, open, onClose, title = "Thanh toán chuyển khoản", width = 560 }: CheckoutQrDrawerProps) {
  return (
    <Drawer title={title} width={width} open={open} onClose={onClose}>
      {/* Countdown until expiration */}
      {checkoutDetail?.expiresAtUtc ? <CountdownBanner expiresAtUtc={checkoutDetail.expiresAtUtc as any} /> : null}

      <Descriptions
        bordered
        size="small"
        title="Thông tin thanh toán"
        column={1}
        items={[
          {
            key: "customer",
            label: "Khách hàng",
            children: checkoutDetail?.customerName ?? "-",
          },
          {
            key: "court",
            label: "Sân",
            children: checkoutDetail?.courtName ?? "-",
          },
          {
            key: "courtTotal",
            label: "Tổng tiền sân",
            children: `${(checkoutDetail?.courtTotalAmount ?? 0).toLocaleString("vi-VN")} đ`,
          },
          {
            key: "courtPaid",
            label: "Đã thanh toán sân",
            children: `${(checkoutDetail?.courtPaidAmount ?? 0).toLocaleString("vi-VN")} đ`,
          },
          {
            key: "courtRemaining",
            label: "Còn lại sân",
            children: `${(checkoutDetail?.courtRemainingAmount ?? 0).toLocaleString("vi-VN")} đ`,
          },
          {
            key: "items",
            label: "Tổng món",
            children: `${(checkoutDetail?.itemsSubtotal ?? 0).toLocaleString("vi-VN")} đ`,
          },
          {
            key: "lateFee",
            label: "Phí muộn",
            children: `${(checkoutDetail?.lateFeeAmount ?? 0).toLocaleString("vi-VN")} đ`,
          },
          {
            key: "overdue",
            label: "Thời gian muộn",
            children: checkoutDetail?.overdueDisplay ?? "0 phút",
          },
          {
            key: "total",
            label: "Tổng thanh toán",
            children: <span className="text-lg font-bold text-red-600">{`${(checkoutDetail?.totalAmount ?? 0).toLocaleString("vi-VN")} đ`}</span>,
          },
        ]}
      />

      <QRSection checkoutDetail={checkoutDetail} />
    </Drawer>
  );
}
