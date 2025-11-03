"use client";

import { CreateUserMembershipResponse } from "@/types-openapi/api";
import { Drawer, Image } from "antd";
import { useEffect, useState } from "react";

interface MembershipQrPaymentDrawerProps {
  detail: CreateUserMembershipResponse | null;
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number;
}

function formatRemaining(ms: number) {
  if (!ms || ms <= 0) return "Hết hạn";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function CountdownBanner({ expiresAtUtc }: { expiresAtUtc: string }) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const expiry = new Date(expiresAtUtc).getTime();
    const tick = () => setRemaining(Math.max(0, expiry - Date.now()));
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
      Thời gian thanh toán còn lại: {formatRemaining(remaining)}
    </div>
  );
}

function QRSection({ detail }: { detail: CreateUserMembershipResponse }) {
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!detail?.expiresAtUtc) return;
    const expiry = new Date(detail.expiresAtUtc as any).getTime();
    const check = () => setIsExpired(Date.now() >= expiry);
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [detail?.expiresAtUtc]);

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
            <div>• Trạng thái thanh toán đã bị hủy hoặc hết hạn</div>
            <div>• Vui lòng tạo lại thanh toán mới</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16, textAlign: "center" }}>
      {detail?.qrUrl ? <Image src={detail.qrUrl} alt="QR thanh toán" style={{ width: 280, height: 280 }} /> : <div>Không có QR</div>}
      <div style={{ marginTop: 8 }}>
        <span>Mã thanh toán: {detail?.paymentId ?? "-"}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <span>Số tiền: {(detail?.paymentAmount ?? 0).toLocaleString("vi-VN")} đ</span>
      </div>
      {detail?.expiresAtUtc && (
        <div style={{ marginTop: 8 }}>
          <span>Hết hạn lúc: {new Date(detail.expiresAtUtc as any).toLocaleString("vi-VN")}</span>
        </div>
      )}
    </div>
  );
}

export default function MembershipQrPaymentDrawer({
  detail,
  open,
  onClose,
  title = "Thanh toán chuyển khoản",
  width = 480,
}: MembershipQrPaymentDrawerProps) {
  return (
    <Drawer title={title} width={width} open={open} onClose={onClose}>
      {detail?.expiresAtUtc ? <CountdownBanner expiresAtUtc={detail.expiresAtUtc as any} /> : null}

      {detail ? <QRSection detail={detail} /> : <div>Không có dữ liệu thanh toán</div>}
    </Drawer>
  );
}
