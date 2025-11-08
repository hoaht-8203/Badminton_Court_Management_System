"use client";

import { ListUserBookingHistoryResponse } from "@/types-openapi/api";
import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { Card, Col, Descriptions, List, Row, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { memo, useMemo } from "react";

const { Text } = Typography;

type Props = {
  record: ListUserBookingHistoryResponse;
};

function Component({ record }: Props) {
  const sortedOccurrences = useMemo(
    () => (record.bookingCourtOccurrences || []).slice().sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()),
    [record.bookingCourtOccurrences],
  );

  return (
    <div className="space-y-4">
      <Card title="Thông tin đặt sân" size="small" className="!mb-2">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Sân">{record.courtName}</Descriptions.Item>
          <Descriptions.Item label="Khách hàng">{record.customerName}</Descriptions.Item>
          <Descriptions.Item label="Ngày bắt đầu">{dayjs(record.startDate).format("DD/MM/YYYY")}</Descriptions.Item>
          <Descriptions.Item label="Ngày kết thúc">{dayjs(record.endDate).format("DD/MM/YYYY")}</Descriptions.Item>
          <Descriptions.Item label="Thời gian">
            {dayjs(record.startTime, "HH:mm:ss").format("HH:mm")} - {dayjs(record.endTime, "HH:mm:ss").format("HH:mm")}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng giờ">{record.totalHours} giờ</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={record.status === "Active" ? "green" : record.status === "PendingPayment" ? "orange" : "default"}>
              {record.status === "Active" ? "Đã đặt & thanh toán" : record.status === "PendingPayment" ? "Chờ thanh toán" : record.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tổng tiền">
            <Text strong style={{ color: "#52c41a" }}>
              {record.totalAmount ? `${record.totalAmount.toLocaleString("vi-VN")} đ` : "Chưa tính"}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Chi tiết các lần sử dụng sân" size="small">
        <List
          dataSource={sortedOccurrences}
          renderItem={(occurrence, index) => (
            <List.Item>
              <div className="w-full">
                <Row>
                  <Col span={8}>
                    <Space>
                      <Text strong style={{ color: "#1890ff", minWidth: "60px" }}>
                        Buổi {index + 1}
                      </Text>
                      <CalendarOutlined />
                      <Text strong>{dayjs(occurrence.date).format("DD/MM/YYYY")}</Text>
                    </Space>
                  </Col>
                  <Col span={8}>
                    <Space>
                      <ClockCircleOutlined />
                      <Text>
                        {dayjs(occurrence.startTime, "HH:mm:ss").format("HH:mm")} - {dayjs(occurrence.endTime, "HH:mm:ss").format("HH:mm")}
                      </Text>
                    </Space>
                  </Col>

                  <Col span={8}>
                    <Tag
                      color={
                        occurrence.status === "Active"
                          ? "green"
                          : occurrence.status === "CheckedIn"
                            ? "blue"
                            : occurrence.status === "Completed"
                              ? "green"
                              : occurrence.status === "NoShow"
                                ? "red"
                                : occurrence.status === "Cancelled"
                                  ? "red"
                                  : occurrence.status === "PendingPayment"
                                    ? "orange"
                                    : "default"
                      }
                    >
                      {occurrence.status === "Active"
                        ? "Đã đặt"
                        : occurrence.status === "CheckedIn"
                          ? "Đang sử dụng"
                          : occurrence.status === "Completed"
                            ? "Hoàn tất"
                            : occurrence.status === "NoShow"
                              ? "Không đến"
                              : occurrence.status === "Cancelled"
                                ? "Đã hủy"
                                : occurrence.status === "PendingPayment"
                                  ? "Chờ thanh toán"
                                  : occurrence.status}
                    </Tag>
                  </Col>

                  {occurrence.note && (
                    <Col span={24}>
                      <div className="mt-2">
                        <Text type="secondary">Ghi chú: {occurrence.note}</Text>
                      </div>
                    </Col>
                  )}
                </Row>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default memo(Component);
