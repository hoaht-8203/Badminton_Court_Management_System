"use client";

import { useParams } from "next/navigation";
import { useDetailBookingCourt } from "@/hooks/useBookingCourt";
import { Descriptions, Image, Spin, Alert, Row, Col } from "antd";
import { useEffect, useState } from "react";
import { DetailBookingCourtResponse } from "@/types-openapi/api";

// Helper component for countdown
function CountdownBanner({ expiresAtUtc }: { expiresAtUtc: string }) {
  const [remaining, setRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const expiry = new Date(expiresAtUtc).getTime();
    const tick = () => {
      const now = Date.now();
      const ms = Math.max(0, expiry - now);
      setRemaining(ms);
      setIsExpired(ms <= 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAtUtc]);

  if (isExpired) {
    return (
      <div
        style={{
          marginBottom: 20,
          padding: 16,
          border: "2px solid #dc2626",
          background: "#fef2f2",
          borderRadius: 8,
          color: "#dc2626",
          fontWeight: 700,
          textAlign: "center",
          fontSize: "18px",
        }}
      >
        QR Code đã hết hạn - Không thể thanh toán
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: 20,
        padding: 16,
        border: "2px solid #dc2626",
        background: "#fef2f2",
        borderRadius: 8,
        color: "#dc2626",
        fontWeight: 700,
        textAlign: "center",
        fontSize: "18px",
      }}
    >
      ⏰ Thời gian giữ chỗ còn lại: {formatRemaining(remaining)}
    </div>
  );
}

// Helper component for QR section with expiration logic
function QRSection({ bookingDetail }: { bookingDetail: DetailBookingCourtResponse }) {
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!bookingDetail.expiresAtUtc) return;

    const expiry = new Date(bookingDetail.expiresAtUtc as any).getTime();
    const checkExpiry = () => {
      const now = Date.now();
      setIsExpired(now >= expiry);
    };

    checkExpiry();
    const id = setInterval(checkExpiry, 1000);
    return () => clearInterval(id);
  }, [bookingDetail.expiresAtUtc]);

  if (isExpired) {
    return (
      <div
        style={{
          padding: "40px",
          background: "#fef2f2",
          borderRadius: "8px",
          border: "2px solid #dc2626",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "24px", color: "#dc2626", marginBottom: "16px" }}>QR Code đã hết hạn</div>
        <div style={{ fontSize: "18px", color: "#dc2626", fontWeight: "bold", marginBottom: "12px" }}>Không thể thanh toán</div>
        <div style={{ fontSize: "16px", color: "#666" }}>
          <div>• Trạng thái đặt sân đã bị hủy</div>
          <div>• Trạng thái thanh toán đã bị hủy</div>
          <div>• Vui lòng liên hệ lễ tân để đặt lại</div>
        </div>
      </div>
    );
  }

  return bookingDetail.qrUrl ? (
    <div>
      <Image
        src={bookingDetail.qrUrl}
        alt="QR thanh toán"
        style={{
          width: 300,
          height: 300,
          border: "2px solid #1890ff",
          borderRadius: "8px",
        }}
      />
      <div style={{ marginTop: "15px", fontSize: "16px" }}>
        <div style={{ marginBottom: "8px" }}>
          <strong>Mã thanh toán:</strong> {bookingDetail.paymentId ?? "-"}
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong>Số tiền:</strong> {(bookingDetail.paymentAmount ?? 0).toLocaleString("vi-VN")} đ
        </div>
        {bookingDetail.expiresAtUtc && (
          <div style={{ marginBottom: "8px" }}>
            <strong>Hết hạn lúc:</strong> {new Date(bookingDetail.expiresAtUtc as any).toLocaleString("vi-VN")}
          </div>
        )}
        <div
          style={{
            color: "#dc2626",
            fontWeight: "bold",
            fontSize: "18px",
          }}
        >
          Thời gian giữ chỗ: {bookingDetail.holdMinutes ?? 0} phút
        </div>
      </div>
    </div>
  ) : (
    <div
      style={{
        padding: "40px",
        background: "#f5f5f5",
        borderRadius: "8px",
        color: "#666",
      }}
    >
      Không có mã QR thanh toán
    </div>
  );
}

// Helper component for instructions with expiration logic
function InstructionsSection({ bookingDetail }: { bookingDetail: DetailBookingCourtResponse }) {
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!bookingDetail.expiresAtUtc) return;

    const expiry = new Date(bookingDetail.expiresAtUtc as any).getTime();
    const checkExpiry = () => {
      const now = Date.now();
      setIsExpired(now >= expiry);
    };

    checkExpiry();
    const id = setInterval(checkExpiry, 1000);
    return () => clearInterval(id);
  }, [bookingDetail.expiresAtUtc]);

  if (isExpired) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "25px",
        padding: "20px",
        background: "#e6f7ff",
        borderRadius: "8px",
        border: "1px solid #91d5ff",
      }}
    >
      <h3 style={{ color: "#1890ff", marginBottom: "15px" }}>Hướng dẫn thanh toán</h3>
      <ol style={{ margin: 0, paddingLeft: "20px" }} className="list-decimal">
        <li>Mở ứng dụng ngân hàng trên điện thoại</li>
        <li>Chọn chức năng &quot;Quét mã QR&quot; hoặc &quot;Thanh toán QR&quot;</li>
        <li>Quét mã QR hiển thị ở trên</li>
        <li>Kiểm tra thông tin thanh toán và xác nhận</li>
        <li>Sau khi thanh toán thành công, thông tin đặt sân sẽ được xác nhận</li>
      </ol>
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

export default function PaymentPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const { data, isLoading, error } = useDetailBookingCourt(bookingId);
  const bookingDetail = data?.data as DetailBookingCourtResponse;

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f5f5f5",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error || !bookingDetail) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f5f5f5",
        }}
      >
        <Alert
          message="Không tìm thấy thông tin thanh toán"
          description="Vui lòng kiểm tra lại mã thanh toán hoặc liên hệ với lễ tân."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          background: "white",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        {/* Countdown banner */}
        {bookingDetail.expiresAtUtc && <CountdownBanner expiresAtUtc={bookingDetail.expiresAtUtc as any} />}

        <Row gutter={[16, 16]}>
          <Col span={24} sm={24} md={12}>
            <Descriptions
              bordered
              size="small"
              title="Thông tin đặt sân"
              column={1}
              style={{ marginBottom: "30px" }}
              items={[
                {
                  key: "type",
                  label: "Loại đặt sân",
                  children: bookingDetail.daysOfWeek && bookingDetail.daysOfWeek.length > 0 ? "Đặt lịch cố định" : "Đặt lịch vãng lai",
                },
                {
                  key: "customer",
                  label: "Khách hàng",
                  children: bookingDetail.customer?.fullName ?? "-",
                },
                {
                  key: "phone",
                  label: "Số điện thoại",
                  children: bookingDetail.customer?.phoneNumber ?? "-",
                },
                {
                  key: "court",
                  label: "Sân cầu lông",
                  children: bookingDetail.courtName ?? "-",
                },
                // Show single date for walk-in
                ...(bookingDetail.daysOfWeek && bookingDetail.daysOfWeek.length > 0
                  ? []
                  : [
                      {
                        key: "date",
                        label: "Ngày đặt",
                        children: `${String(bookingDetail.startDate)}`,
                      },
                    ]),
                // Show date range and days of week for fixed schedule
                ...(bookingDetail.daysOfWeek && bookingDetail.daysOfWeek.length > 0
                  ? [
                      {
                        key: "range",
                        label: "Khoảng thời gian",
                        children: `${String(bookingDetail.startDate)} - ${String(bookingDetail.endDate)}`,
                      },
                      {
                        key: "daysOfWeek",
                        label: "Các ngày trong tuần",
                        children: bookingDetail.daysOfWeek.join(", "),
                      },
                    ]
                  : []),
                {
                  key: "time",
                  label: "Thời gian",
                  children: `${String(bookingDetail.startTime)} - ${String(bookingDetail.endTime)}`,
                },
                {
                  key: "amount",
                  label: "Số tiền cần thanh toán",
                  children: (
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#dc2626",
                      }}
                    >
                      {`${(bookingDetail.paymentAmount ?? 0).toLocaleString("vi-VN")} đ`}
                    </span>
                  ),
                },
              ]}
            />
          </Col>
          <Col span={24} sm={24} md={12}>
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                background: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <h2 style={{ color: "#1890ff", marginBottom: "20px" }}>Quét mã QR để thanh toán</h2>
              <QRSection bookingDetail={bookingDetail} />
            </div>
          </Col>
        </Row>

        {/* Instructions - only show if not expired */}
        <InstructionsSection bookingDetail={bookingDetail} />
      </div>
    </div>
  );
}
