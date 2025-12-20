"use client";

import { ListUserBookingHistoryResponse, ListFeedbackResponse } from "@/types-openapi/api";
import { CalendarOutlined, ClockCircleOutlined, MessageOutlined, CheckCircleOutlined, EditOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Card, Col, Descriptions, List, Row, Space, Tag, Typography, Button, Rate, Divider, Modal, message } from "antd";
import dayjs from "dayjs";
import { memo, useMemo, useState } from "react";
import FeedbackModal from "@/components/homepage/FeedbackModal";
import { useGetFeedbackByCustomer } from "@/hooks/useFeedback";
import { courtScheduleService } from "@/services/courtScheduleService";

const { Text } = Typography;

type Props = {
  record: ListUserBookingHistoryResponse;
  onCancelSuccess?: () => void;
};

function Component({ record, onCancelSuccess }: Props) {
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(null);
  const [cancellingOccurrenceId, setCancellingOccurrenceId] = useState<string | null>(null);

  // Load all feedbacks of the customer to check if they've already feedback for each occurrence
  const { data: customerFeedbacks } = useGetFeedbackByCustomer(record.customerId, !!record.customerId);

  // Create a map of occurrenceId -> feedback for quick lookup
  const feedbackMap = useMemo(() => {
    const map = new Map<string, ListFeedbackResponse>();
    if (customerFeedbacks?.data) {
      customerFeedbacks.data.forEach((feedback) => {
        if (feedback.bookingCourtOccurrenceId && feedback.status !== "Deleted") {
          map.set(feedback.bookingCourtOccurrenceId, feedback);
        }
      });
    }
    return map;
  }, [customerFeedbacks]);

  const sortedOccurrences = useMemo(
    () => (record.bookingCourtOccurrences || []).slice().sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()),
    [record.bookingCourtOccurrences],
  );

  const handleOpenFeedbackModal = (occurrenceId: string) => {
    setSelectedOccurrenceId(occurrenceId);
    setFeedbackModalOpen(true);
  };

  const handleCloseFeedbackModal = () => {
    setFeedbackModalOpen(false);
    setSelectedOccurrenceId(null);
  };

  const handleFeedbackSuccess = () => {
    // Refetch feedbacks after successful submission
    // The query will automatically refetch due to query invalidation in the hook
  };

  // Check if occurrence can be cancelled (PendingPayment, Active, or NoShow)
  const canCancelOccurrence = (status: string) => {
    return status === "PendingPayment" || status === "Active" || status === "NoShow";
  };

  const handleCancelOccurrence = (occurrenceId: string, occurrenceDate: string | Date, occurrenceTime: string) => {
    Modal.confirm({
      title: "Xác nhận hủy lịch sân",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn hủy lịch sân này?</p>
          <p>
            <strong>Ngày:</strong>{" "}
            {typeof occurrenceDate === "string" ? dayjs(occurrenceDate).format("DD/MM/YYYY") : dayjs(occurrenceDate).format("DD/MM/YYYY")}
          </p>
          <p>
            <strong>Thời gian:</strong> {occurrenceTime}
          </p>
          <p style={{ color: "#ff4d4f", marginTop: 8 }}>Lưu ý: Không thể hủy lịch sân đã CheckIn hoặc Completed.</p>
        </div>
      ),
      okText: "Xác nhận hủy",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setCancellingOccurrenceId(occurrenceId);
          const result = await courtScheduleService.userCancelBookingOccurrence({
            id: occurrenceId,
          });

          if (result.success) {
            message.success("Hủy lịch sân thành công!");
            onCancelSuccess?.();
          } else {
            message.error(result.message || "Hủy lịch sân thất bại!");
          }
        } catch (error: any) {
          message.error(error?.response?.data?.message || error?.message || "Hủy lịch sân thất bại!");
        } finally {
          setCancellingOccurrenceId(null);
        }
      },
    });
  };

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

                  <Col span={6}>
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

                  <Col span={10}>
                    <Space>
                      {occurrence.status === "Completed" && occurrence.id && (
                        <>
                          {feedbackMap.has(occurrence.id) ? (
                            <Tag icon={<CheckCircleOutlined />} color="green">
                              Đã đánh giá
                            </Tag>
                          ) : (
                            <Button type="primary" size="small" icon={<MessageOutlined />} onClick={() => handleOpenFeedbackModal(occurrence.id!)}>
                              Đánh giá
                            </Button>
                          )}
                        </>
                      )}
                      {occurrence.id &&
                        occurrence.status &&
                        canCancelOccurrence(occurrence.status) &&
                        (occurrence.status === "PendingPayment" || occurrence.status === "Active" || occurrence.status === "NoShow") && (
                          <Button
                            danger
                            size="small"
                            icon={<CloseCircleOutlined />}
                            onClick={() => {
                              if (occurrence.id && occurrence.date) {
                                const dateStr = typeof occurrence.date === "string" ? occurrence.date : dayjs(occurrence.date).format("YYYY-MM-DD");
                                handleCancelOccurrence(
                                  occurrence.id,
                                  dateStr,
                                  `${dayjs(occurrence.startTime, "HH:mm:ss").format("HH:mm")} - ${dayjs(occurrence.endTime, "HH:mm:ss").format("HH:mm")}`,
                                );
                              }
                            }}
                            loading={cancellingOccurrenceId === occurrence.id}
                          >
                            Hủy lịch
                          </Button>
                        )}
                    </Space>
                  </Col>

                  {occurrence.note && (
                    <Col span={24}>
                      <div className="mt-2">
                        <Text type="secondary">Ghi chú: {occurrence.note}</Text>
                      </div>
                    </Col>
                  )}

                  {/* Hiển thị feedback đã gửi nếu có */}
                  {occurrence.status === "Completed" && occurrence.id && feedbackMap.has(occurrence.id) && (
                    <Col span={24}>
                      <Divider style={{ margin: "12px 0" }} />
                      <Card
                        size="small"
                        style={{
                          backgroundColor: "#f6ffed",
                          borderColor: "#b7eb8f",
                          marginTop: 8,
                        }}
                        title={
                          <Space>
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                            <Text strong style={{ color: "#52c41a" }}>
                              Đánh giá của bạn
                            </Text>
                          </Space>
                        }
                        extra={
                          <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenFeedbackModal(occurrence.id!)}
                            style={{ padding: 0 }}
                          >
                            Sửa
                          </Button>
                        }
                      >
                        <Space direction="vertical" style={{ width: "100%" }} size="small">
                          <div>
                            <Text strong>Đánh giá tổng thể: </Text>
                            <Rate disabled value={feedbackMap.get(occurrence.id)?.rating || 0} />
                            <Text style={{ marginLeft: 8 }}>({feedbackMap.get(occurrence.id)?.rating}/5)</Text>
                          </div>
                          {feedbackMap.get(occurrence.id)?.comment && (
                            <div>
                              <Text strong>Nhận xét: </Text>
                              <Text>{feedbackMap.get(occurrence.id)?.comment}</Text>
                            </div>
                          )}
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Đánh giá vào:{" "}
                              {feedbackMap.get(occurrence.id)?.createdAt
                                ? dayjs(feedbackMap.get(occurrence.id)?.createdAt).format("DD/MM/YYYY HH:mm")
                                : "-"}
                            </Text>
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  )}
                </Row>
              </div>
            </List.Item>
          )}
        />
      </Card>

      {selectedOccurrenceId && (
        <FeedbackModal
          open={feedbackModalOpen}
          onClose={handleCloseFeedbackModal}
          bookingCourtOccurrenceId={selectedOccurrenceId}
          customerId={record.customerId}
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  );
}

export default memo(Component);
