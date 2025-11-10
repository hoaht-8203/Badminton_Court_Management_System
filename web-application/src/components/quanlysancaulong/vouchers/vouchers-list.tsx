"use client";

import { VoucherResponse } from "@/types-openapi/api";
import { CalendarOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined, UserOutlined } from "@ant-design/icons";
import { Tag as AntTag, Button, Card, Descriptions, Divider, Empty, Popconfirm, Space, Table, Tabs, message } from "antd";
import dayjs from "dayjs";
import { createVouchersColumns } from "./vouchers-columns";

interface VouchersListProps {
  vouchers: VoucherResponse[];
  loading?: boolean;
  onEdit: (voucher: VoucherResponse) => void;
  onDelete: (id: number) => void;
  onExtend: (voucher: VoucherResponse) => void;
}

const VouchersList = ({ vouchers, loading, onEdit, onDelete, onExtend }: VouchersListProps) => {
  const columns = createVouchersColumns();

  const expandedRowRender = (record: VoucherResponse) => {
    const discountLabel =
      record.discountType === "percentage"
        ? `${record.discountPercentage ?? 0}%${record.maxDiscountValue ? ` (tối đa ${record.maxDiscountValue.toLocaleString("vi-VN")} VNĐ)` : ""}`
        : `${(record.discountValue ?? 0).toLocaleString("vi-VN")} VNĐ`;

    const formatDayOfWeek = (d: number) => {
      const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
      return days[d] || `Thứ ${d}`;
    };

    const hasTimeRules = record.timeRules && record.timeRules.length > 0;
    const hasUserRules = record.userRules && record.userRules.length > 0;

    const items = [
      {
        key: "1",
        label: "Thông tin cơ bản",
        children: (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Mã voucher" span={1}>
              <span className="font-mono font-semibold">{record.code}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Tiêu đề" span={1}>
              {record.title}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={2}>
              {record.description || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Loại giảm giá" span={1}>
              <AntTag color={record.discountType === "percentage" ? "blue" : "green"}>
                {record.discountType === "percentage" ? "Phần trăm" : "Cố định"}
              </AntTag>
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị giảm" span={1}>
              {discountLabel}
            </Descriptions.Item>
            <Descriptions.Item label="Đơn tối thiểu" span={1}>
              {record.minOrderValue ? `${record.minOrderValue.toLocaleString("vi-VN")} VNĐ` : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái" span={1}>
              <AntTag color={record.isActive ? "success" : "error"}>{record.isActive ? "Hoạt động" : "Không hoạt động"}</AntTag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu" span={1}>
              {record.startAt ? dayjs(record.startAt).format("DD/MM/YYYY HH:mm") : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày kết thúc" span={1}>
              {record.endAt ? dayjs(record.endAt).format("DD/MM/YYYY HH:mm") : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Giới hạn tổng" span={1}>
              {record.usageLimitTotal === 0 ? "Không giới hạn" : `${record.usedCount ?? 0}/${record.usageLimitTotal}`}
            </Descriptions.Item>
            <Descriptions.Item label="Giới hạn mỗi user" span={1}>
              {record.usageLimitPerUser === 0 ? "Không giới hạn" : record.usageLimitPerUser}
            </Descriptions.Item>
            <Descriptions.Item label="Đã sử dụng" span={2}>
              <AntTag color="blue">{record.usedCount ?? 0} lần</AntTag>
            </Descriptions.Item>
          </Descriptions>
        ),
      },
      {
        key: "2",
        label: "Đối tượng áp dụng",
        children: (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card
              size="small"
              title={
                <span>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  Quy tắc thời gian
                </span>
              }
            >
              {!hasTimeRules ? (
                <Empty description="Không có quy tắc thời gian" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(record.timeRules || []).map((r, i) => (
                    <Card key={i} size="small" style={{ backgroundColor: "#fafafa" }}>
                      <Descriptions column={1} size="small" colon={false}>
                        {r.dayOfWeek != null && (
                          <Descriptions.Item label="Thứ trong tuần">
                            <AntTag color="blue">{formatDayOfWeek(r.dayOfWeek)}</AntTag>
                          </Descriptions.Item>
                        )}
                        {r.specificDate && (
                          <Descriptions.Item label="Ngày cụ thể">
                            <AntTag color="purple">{dayjs(r.specificDate).format("DD/MM/YYYY")}</AntTag>
                          </Descriptions.Item>
                        )}
                        {(r.startTime || r.endTime) && (
                          <Descriptions.Item label="Khung giờ">
                            <AntTag color="orange">
                              {r.startTime ?? "00:00"} - {r.endTime ?? "23:59"}
                            </AntTag>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            <Card
              size="small"
              title={
                <span>
                  <UserOutlined style={{ marginRight: 8 }} />
                  Quy tắc người dùng
                </span>
              }
            >
              {!hasUserRules ? (
                <Empty description="Không có quy tắc người dùng" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(record.userRules || []).map((u, i) => (
                    <Card key={i} size="small" style={{ backgroundColor: "#fafafa" }}>
                      <Descriptions column={1} size="small" colon={false}>
                        {u.isNewCustomer != null && (
                          <Descriptions.Item label="Khách hàng mới">
                            <AntTag color={u.isNewCustomer ? "green" : "default"}>{u.isNewCustomer ? "Có" : "Không"}</AntTag>
                          </Descriptions.Item>
                        )}
                        {u.userType && (
                          <Descriptions.Item label="Loại người dùng">
                            <AntTag color="cyan">{u.userType}</AntTag>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ),
      },
    ];

    return (
      <div style={{ padding: "16px", backgroundColor: "#fafafa" }}>
        <Tabs defaultActiveKey="1" items={items} />
        <Divider style={{ margin: "16px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
          <div>
            {(record.usedCount ?? 0) > 0 && (
              <span style={{ color: "#999", fontSize: "12px", marginRight: 16 }}>
                * Voucher này đã được sử dụng {record.usedCount ?? 0} lần, không thể xóa
              </span>
            )}
          </div>
          <Space>
            <Button type="primary" icon={<ClockCircleOutlined />} onClick={() => onExtend(record)}>
              Gia hạn
            </Button>
            <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>
              Sửa
            </Button>
            <Popconfirm
              title="Xóa voucher"
              description={(record.usedCount ?? 0) > 0 ? "Voucher này đã được sử dụng, không thể xóa." : "Bạn có chắc chắn muốn xóa voucher này?"}
              onConfirm={() => {
                if ((record.usedCount ?? 0) > 0) {
                  message.error("Không thể xóa voucher đã được sử dụng");
                  return;
                }
                onDelete(record.id ?? 0);
              }}
              okText="Xóa"
              cancelText="Hủy"
              disabled={(record.usedCount ?? 0) > 0}
            >
              <Button danger icon={<DeleteOutlined />} disabled={(record.usedCount ?? 0) > 0}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        </div>
      </div>
    );
  };

  return (
    <Table
      columns={columns}
      dataSource={vouchers}
      loading={loading}
      rowKey="id"
      scroll={{ x: 1400 }}
      expandable={{
        expandedRowRender,
        expandRowByClick: false,
      }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} voucher`,
      }}
    />
  );
};

export default VouchersList;
