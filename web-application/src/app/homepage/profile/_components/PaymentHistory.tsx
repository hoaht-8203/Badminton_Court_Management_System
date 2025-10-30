"use client";

import { ListUserBookingHistoryResponse, PaymentDto } from "@/types-openapi/api";
import { CreditCardOutlined } from "@ant-design/icons";
import { Card, Descriptions, List, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { memo, useMemo } from "react";

const { Text } = Typography;

type Props = {
  record: ListUserBookingHistoryResponse;
};

function Component({ record }: Props) {
  const allPayments = useMemo<PaymentDto[]>(() => {
    const bookingPayments = record.payments || [];
    const occurrencePayments = record.bookingCourtOccurrences?.flatMap((occ) => occ.payments || []) || [];
    const all = [...bookingPayments, ...occurrencePayments];
    return all.filter((payment, index, self) => index === self.findIndex((p) => p.id === payment.id));
  }, [record.bookingCourtOccurrences, record.payments]);

  return (
    <div className="space-y-4">
      <Card title="Tổng quan thanh toán" size="small" className="!mb-2">
        <Descriptions column={3} size="small">
          <Descriptions.Item label="Tổng tiền">
            <Text strong style={{ color: "#52c41a" }}>
              {record.totalAmount ? `${record.totalAmount.toLocaleString("vi-VN")} đ` : "Chưa tính"}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Đã trả">
            <Text type="success">{record.paidAmount ? `${record.paidAmount.toLocaleString("vi-VN")} đ` : "0 đ"}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Còn lại">
            <Text type="warning">{record.remainingAmount ? `${record.remainingAmount.toLocaleString("vi-VN")} đ` : "0 đ"}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Lịch sử thanh toán" size="small">
        <List
          dataSource={allPayments}
          renderItem={(payment) => (
            <List.Item>
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <Space>
                    <CreditCardOutlined />
                    <Text strong>{payment.id}</Text>
                  </Space>
                  <Space>
                    <Text strong style={{ color: "#52c41a" }}>
                      {payment.amount ? `${payment.amount.toLocaleString("vi-VN")} đ` : "0 đ"}
                    </Text>
                    <Tag
                      color={
                        payment.status === "Paid"
                          ? "green"
                          : payment.status === "PendingPayment"
                            ? "orange"
                            : payment.status === "Cancelled"
                              ? "red"
                              : "default"
                      }
                    >
                      {payment.status === "Paid"
                        ? "Đã thanh toán"
                        : payment.status === "PendingPayment"
                          ? "Chờ thanh toán"
                          : payment.status === "Cancelled"
                            ? "Đã hủy"
                            : payment.status}
                    </Tag>
                  </Space>
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-500">
                  <Text type="secondary">Ngày tạo: {dayjs(payment.paymentCreatedAt).format("DD/MM/YYYY HH:mm")}</Text>
                  {payment.note && <Text type="secondary">Ghi chú: {payment.note}</Text>}
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default memo(Component);
