"use client";

import { CreateUserMembershipResponse } from "@/types-openapi/api";
import { Drawer, Image, message } from "antd";
import { useEffect, useState, useRef } from "react";
import { HubConnection, HubConnectionBuilder, HttpTransportType, ILogger, LogLevel } from "@microsoft/signalr";
import { apiBaseUrl } from "@/lib/axios";

interface MembershipQrPaymentDrawerProps {
  detail: CreateUserMembershipResponse | null;
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number;
  onPaymentSuccess?: () => void;
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
  onPaymentSuccess,
}: MembershipQrPaymentDrawerProps) {
  const connectionRef = useRef<HubConnection | null>(null);
  const hasStartedRef = useRef(false);
  const unmountedRef = useRef(false);

  // SignalR connection for payment updates
  useEffect(() => {
    if (!open || !detail?.paymentId) {
      return;
    }

    // Custom logger to filter benign startup races that cause noisy Next.js error overlays
    const filteredLogger: ILogger = {
      log: (level, message) => {
        const text = String(message ?? "");
        // Suppress known harmless races during StrictMode mounts/unmounts
        if (text.includes("stopped during negotiation") || text.includes("before stop() was called")) {
          return;
        }

        if (level >= LogLevel.Error) {
          console.error(`[SignalR] ${text}`);
        } else if (level >= LogLevel.Warning) {
          console.warn(`[SignalR] ${text}`);
        } else if (level >= LogLevel.Information) {
          console.info(`[SignalR] ${text}`);
        } else {
          // Trace level
          if (process.env.NODE_ENV === "development") {
            console.debug(`[SignalR] ${text}`);
          }
        }
      },
    };

    const conn = new HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/hubs/booking`, {
        withCredentials: true,
        skipNegotiation: false, // Allow negotiation to try different transports
        transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(filteredLogger)
      .build();
    connectionRef.current = conn;

    conn.on("paymentUpdated", (paymentId: string) => {
      // Check if this payment update is for our current payment
      if (detail?.paymentId === paymentId) {
        message.success("Thanh toán thành công!", 5);
        onPaymentSuccess?.();
        onClose(); // Auto close drawer on successful payment
      }
    });

    conn.on("paymentCreated", (payload: any) => {
      // Handle payment created if needed
      console.log("Payment created:", payload);
    });

    let isAlive = true;
    const handleBeforeUnload = () => {
      // Ensure connection is stopped before page is unloaded
      try {
        conn.stop();
      } catch {}
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    (async () => {
      try {
        await conn.start();
        if (!isAlive) return; // component unmounted during start -> ignore
        hasStartedRef.current = true;
        console.log("SignalR connected for payment updates");
      } catch (err) {
        const name = (err as any)?.name as string | undefined;
        const errMessage = (err as Error)?.message || "";
        // Ignore benign race when cleanup stops connection before start resolves (StrictMode / fast remount)
        if (name === "AbortError" || errMessage.includes("before stop() was called") || errMessage.includes("stopped during negotiation")) {
          return;
        }
        console.debug("SignalR start non-fatal:", err);
        // Show user-facing error toast for real connection failures
        const humanMsg = (err as Error)?.message || "Không thể kết nối realtime.";
        message.open({ type: "error", content: humanMsg, key: "signalr-connect-error", duration: 3 });
      }
    })();

    return () => {
      isAlive = false;
      unmountedRef.current = true;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Only stop if we actually started, and avoid stopping if already disconnected
      conn
        .stop()
        .then(() => {
          // disconnected
        })
        .catch(() => {
          // swallow stop race errors
        });
    };
  }, [open, detail?.paymentId, onPaymentSuccess, onClose]);

  return (
    <Drawer title={title} width={width} open={open} onClose={onClose}>
      {detail?.expiresAtUtc ? <CountdownBanner expiresAtUtc={detail.expiresAtUtc as any} /> : null}

      {detail ? <QRSection detail={detail} /> : <div>Không có dữ liệu thanh toán</div>}
    </Drawer>
  );
}
