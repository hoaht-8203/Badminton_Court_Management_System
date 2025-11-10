"use client";

import { ListFeedbackResponse, DetailFeedbackResponse } from "@/types-openapi/api";
import { DeleteOutlined, EyeOutlined, MessageOutlined } from "@ant-design/icons";
import { Tag as AntTag, Button, Descriptions, Divider, Empty, Image, Popconfirm, Rate, Space, Table, Tabs, message } from "antd";
import dayjs from "dayjs";
import { createFeedbackColumns } from "./feedback-columns";
import { useGetFeedbackDetail } from "@/hooks/useFeedback";
import { useMemo, useState } from "react";

interface FeedbacksListProps {
  feedbacks: ListFeedbackResponse[];
  loading?: boolean;
  onReply: (feedback: ListFeedbackResponse) => void;
  onDelete: (id: number) => void;
  onViewDetail: (feedback: ListFeedbackResponse) => void;
}

const FeedbacksList = ({ feedbacks, loading, onReply, onDelete, onViewDetail }: FeedbacksListProps) => {
  const columns = createFeedbackColumns();
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  const ExpandedRowContent = ({ record, isExpanded }: { record: ListFeedbackResponse; isExpanded: boolean }) => {
    // Chỉ fetch detail khi row được expand và có id
    const { data: feedbackDetail, isLoading } = useGetFeedbackDetail(record.id, isExpanded && !!record.id);
    const detail: DetailFeedbackResponse | null = feedbackDetail?.data || null;
    const mediaCount = useMemo(() => detail?.mediaUrl?.length || 0, [detail?.mediaUrl?.length]);

    const items = useMemo(
      () => [
        {
          key: "1",
          label: "Thông tin chi tiết",
          children: isLoading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>Đang tải...</div>
          ) : (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="ID Feedback">{record.id}</Descriptions.Item>
              <Descriptions.Item label="ID Khách hàng">{record.customerId}</Descriptions.Item>
              <Descriptions.Item label="ID Lịch đặt">{record.bookingCourtOccurrenceId}</Descriptions.Item>
              <Descriptions.Item label="Đánh giá tổng thể">
                <Rate disabled defaultValue={record.rating} />
              </Descriptions.Item>
              <Descriptions.Item label="Bình luận" span={2}>
                {record.comment || "-"}
              </Descriptions.Item>
              {detail && (
                <>
                  <Descriptions.Item label="Đánh giá chi tiết" span={2}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div>
                        <span style={{ marginRight: 8 }}>Chất lượng sân:</span>
                        <Rate disabled defaultValue={detail.courtQuality || 0} />
                      </div>
                      <div>
                        <span style={{ marginRight: 8 }}>Dịch vụ nhân viên:</span>
                        <Rate disabled defaultValue={detail.staffService || 0} />
                      </div>
                      <div>
                        <span style={{ marginRight: 8 }}>Vệ sinh:</span>
                        <Rate disabled defaultValue={detail.cleanliness || 0} />
                      </div>
                      <div>
                        <span style={{ marginRight: 8 }}>Ánh sáng:</span>
                        <Rate disabled defaultValue={detail.lighting || 0} />
                      </div>
                      <div>
                        <span style={{ marginRight: 8 }}>Giá trị đồng tiền:</span>
                        <Rate disabled defaultValue={detail.valueForMoney || 0} />
                      </div>
                    </div>
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Trạng thái">
                <AntTag color={record.status === "Active" ? "green" : record.status === "Deleted" ? "red" : "orange"}>
                  {record.status === "Active" ? "Hoạt động" : record.status === "Deleted" ? "Đã xóa" : "Ẩn"}
                </AntTag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{record.createdAt ? dayjs(record.createdAt).format("DD/MM/YYYY HH:mm") : "-"}</Descriptions.Item>
              {detail?.adminReply && (
                <>
                  <Descriptions.Item label="Phản hồi admin" span={2}>
                    {detail.adminReply}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày phản hồi" span={2}>
                    {detail.adminReplyAt ? dayjs(detail.adminReplyAt).format("DD/MM/YYYY HH:mm") : "-"}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          ),
        },
        {
          key: "2",
          label: `Hình ảnh (${mediaCount})`,
          children: isLoading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>Đang tải...</div>
          ) : detail && detail.mediaUrl && Array.isArray(detail.mediaUrl) && detail.mediaUrl.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {detail.mediaUrl.map((url: string, index: number) => (
                <Image key={index} src={url} alt={`Feedback image ${index + 1}`} width={200} height={200} style={{ objectFit: "cover" }} />
              ))}
            </div>
          ) : (
            <Empty description="Không có hình ảnh" />
          ),
        },
      ],
      [detail, isLoading, mediaCount],
    );

    return (
      <div style={{ padding: "16px", backgroundColor: "#fafafa" }}>
        <Tabs defaultActiveKey="1" items={items} />
        <Divider style={{ margin: "16px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
          <div>
            {record.status === "Deleted" && <span style={{ color: "#999", fontSize: "12px", marginRight: 16 }}>* Feedback này đã bị xóa</span>}
          </div>
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => onViewDetail(record)}>
              Xem chi tiết
            </Button>
            {record.status !== "Deleted" && record.id !== undefined && (
              <>
                <Button type="primary" icon={<MessageOutlined />} onClick={() => onReply(record)}>
                  {detail?.adminReply ? "Sửa phản hồi" : "Phản hồi"}
                </Button>
                <Popconfirm
                  title="Xóa feedback"
                  description="Bạn có chắc chắn muốn xóa feedback này? (Feedback sẽ được đánh dấu là đã xóa)"
                  onConfirm={() => {
                    if (record.id !== undefined) {
                      onDelete(record.id);
                    }
                  }}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Xóa
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        </div>
      </div>
    );
  };

  const expandedRowRender = (record: ListFeedbackResponse) => {
    // expandedRowRender chỉ được gọi khi row được expand, nên luôn fetch detail
    return <ExpandedRowContent record={record} isExpanded={true} />;
  };

  return (
    <Table
      columns={columns}
      dataSource={feedbacks}
      loading={loading}
      rowKey={(record) => record.id ?? `feedback-${record.customerId}-${record.bookingCourtOccurrenceId}`}
      scroll={{ x: 1200 }}
      expandable={{
        expandedRowRender,
        expandRowByClick: false,
        expandedRowKeys: expandedRowKeys,
        onExpand: (expanded, record) => {
          if (record.id !== undefined) {
            if (expanded) {
              setExpandedRowKeys([...expandedRowKeys, record.id]);
            } else {
              setExpandedRowKeys(expandedRowKeys.filter((key) => key !== record.id));
            }
          }
        },
        onExpandedRowsChange: (expandedKeys) => {
          setExpandedRowKeys([...expandedKeys]);
        },
      }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} feedback`,
      }}
    />
  );
};

export default FeedbacksList;
