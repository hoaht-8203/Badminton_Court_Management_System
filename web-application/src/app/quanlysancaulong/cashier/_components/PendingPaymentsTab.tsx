"use client";

import { memo, useCallback, useState } from "react";
import { Button, Card, Col, Empty, Row, Select, Spin, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { OrderResponse } from "@/types-openapi/api";

interface PendingPaymentsTabProps {
  data: OrderResponse[];
  loading: boolean;
  filter: { status?: string; paymentMethod?: string };
  onFilterChange: (filter: { status?: string; paymentMethod?: string }) => void;
  extendPaymentTime: (orderId: string) => Promise<any>;
}

const PendingPaymentsTab = memo(function PendingPaymentsTab({ data, loading, filter, onFilterChange, extendPaymentTime }: PendingPaymentsTabProps) {
  const [extendingPayment, setExtendingPayment] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "Cash":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Bank":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleExtendPayment = useCallback(
    async (orderId: string) => {
      setExtendingPayment(orderId);
      try {
        await extendPaymentTime(orderId);
        message.success("Gia hạn thanh toán thành công! Thêm 5 phút để thanh toán.");
        window.location.reload();
      } catch (error: any) {
        message.error(error?.message || "Không thể gia hạn thanh toán");
      } finally {
        setExtendingPayment(null);
      }
    },
    [extendPaymentTime],
  );

  return (
    <div className="h-full p-3">
      <div className="mb-4 rounded border bg-gray-50 p-3">
        <div className="mb-2 text-sm font-semibold">Bộ lọc</div>
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <div className="mb-1 text-xs text-gray-600">Trạng thái</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Tất cả trạng thái"
              value={filter.status || undefined}
              onChange={(value) => onFilterChange({ ...filter, status: value || undefined })}
              allowClear
              options={[
                { value: "Pending", label: "Chờ thanh toán" },
                { value: "Paid", label: "Đã thanh toán" },
                { value: "Cancelled", label: "Đã hủy" },
              ]}
            />
          </Col>
          <Col span={12}>
            <div className="mb-1 text-xs text-gray-600">Phương thức thanh toán</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Tất cả phương thức"
              value={filter.paymentMethod || undefined}
              onChange={(value) => onFilterChange({ ...filter, paymentMethod: value || undefined })}
              allowClear
              options={[
                { value: "Cash", label: "Tiền mặt" },
                { value: "Bank", label: "Chuyển khoản" },
              ]}
            />
          </Col>
        </Row>
      </div>

      <div className="h-full overflow-auto">
        {loading ? (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div className="text-lg font-bold">Đang tải dữ liệu...</div>
          </div>
        ) : data.length === 0 ? (
          <Empty description="Không có đơn hàng nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className="flex flex-col gap-2">
            {data.map((order, index) => (
              <Card key={order.id || index} size="small" className="transition-shadow hover:shadow-md">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Đơn hàng #{order.id?.substring(0, 8) || "N/A"}</div>
                    <div className="flex gap-2">
                      <span className={`rounded border px-2 py-1 text-xs ${getStatusColor(order.status || "")}`}>
                        Trạng thái:{" "}
                        {order.status === "Pending"
                          ? "Chờ thanh toán"
                          : order.status === "Paid"
                            ? "Đã thanh toán"
                            : order.status === "Cancelled"
                              ? "Đã hủy"
                              : order.status || "N/A"}
                      </span>
                      <span className={`rounded border px-2 py-1 text-xs ${getPaymentMethodColor(order.paymentMethod || "")}`}>
                        Phương thức thanh toán:{" "}
                        {order.paymentMethod === "Cash" ? "Tiền mặt" : order.paymentMethod === "Bank" ? "Chuyển khoản" : order.paymentMethod || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div>Khách hàng: {order.customerName || "N/A"}</div>
                    <div>Sân: {order.courtName || "N/A"}</div>
                    <div>Ngày tạo: {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "N/A"}</div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-2">
                    <div className="text-sm text-gray-600">
                      Tổng tiền: <span className="text-lg font-semibold text-red-600">{(order.totalAmount || 0).toLocaleString("vi-VN")} đ</span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === "Pending" && order.paymentMethod === "Bank" && (
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => {
                            const checkoutUrl = `/checkout/${order.id}`;
                            window.open(checkoutUrl, "_blank");
                          }}
                        >
                          Xem QR
                        </Button>
                      )}
                      {order.status === "Cancelled" && order.paymentMethod === "Bank" && (
                        <Button type="default" size="small" loading={extendingPayment === order.id} onClick={() => handleExtendPayment(order.id!)}>
                          Gia hạn 5 phút
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default PendingPaymentsTab;
