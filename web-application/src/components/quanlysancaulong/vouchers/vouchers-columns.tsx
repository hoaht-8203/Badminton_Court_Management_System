"use client";

import { VoucherResponse } from "@/types-openapi/api";
import { TableProps, Tag, Button, Space, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface VouchersColumnsProps {
  onEdit: (voucher: VoucherResponse) => void;
  onDelete: (id: number) => void;
  onExtend: (voucher: VoucherResponse) => void;
}

export const createVouchersColumns = ({ onEdit, onDelete, onExtend }: VouchersColumnsProps): TableProps<VoucherResponse>["columns"] => [
  {
    title: "Mã voucher",
    dataIndex: "code",
    key: "code",
    width: 150,
    fixed: "left",
    render: (code) => <span className="font-mono font-semibold">{code}</span>,
  },
  {
    title: "Tiêu đề",
    dataIndex: "title",
    key: "title",
    width: 200,
  },
  {
    title: "Loại giảm giá",
    dataIndex: "discountType",
    key: "discountType",
    width: 120,
    render: (type) => <Tag color={type === "percentage" ? "blue" : "green"}>{type === "percentage" ? "Phần trăm" : "Cố định"}</Tag>,
  },
  {
    title: "Giá trị giảm",
    key: "discountValue",
    width: 150,
    render: (_, record) => {
      if (record.discountType === "percentage") {
        const pct = record.discountPercentage ?? 0;
        const max = record.maxDiscountValue;
        return `${pct}%${max ? ` (tối đa ${max.toLocaleString("vi-VN")} VNĐ)` : ""}`;
      }
      const val = record.discountValue ?? 0;
      return `${val.toLocaleString("vi-VN")} VNĐ`;
    },
  },
  {
    title: "Đơn tối thiểu",
    dataIndex: "minOrderValue",
    key: "minOrderValue",
    width: 150,
    render: (value) => (value ? `${value.toLocaleString("vi-VN")} VNĐ` : "-"),
  },
  {
    title: "Ngày bắt đầu",
    dataIndex: "startAt",
    key: "startAt",
    width: 180,
    render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-"),
  },
  {
    title: "Ngày kết thúc",
    dataIndex: "endAt",
    key: "endAt",
    width: 180,
    render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-"),
  },
  {
    title: "Quy tắc thời gian",
    key: "timeRules",
    width: 300,
    render: (_, record) => {
      const rules = record.timeRules ?? [];
      if (!rules.length) return "-";
      const formatDay = (d: any) => {
        if (d === 0) return "Chủ nhật";
        if (d === 1) return "Thứ 2";
        if (d === 2) return "Thứ 3";
        if (d === 3) return "Thứ 4";
        if (d === 4) return "Thứ 5";
        if (d === 5) return "Thứ 6";
        if (d === 6) return "Thứ 7";
        return String(d);
      };

      return (
        <div>
          {rules.map((r, idx) => (
            <div key={idx} style={{ marginBottom: 6 }}>
              {r.dayOfWeek != null ? <div>{formatDay(r.dayOfWeek)}</div> : null}
              {r.specificDate ? <div>Ngày: {dayjs(r.specificDate).format("DD/MM/YYYY")}</div> : null}
              {(r.startTime || r.endTime) && (
                <div>
                  Giờ: {r.startTime ?? "-"} - {r.endTime ?? "-"}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    },
  },
  {
    title: "Giới hạn",
    key: "limits",
    width: 150,
    render: (_, record) => (
      <div>
        <div>
          Tổng: {record.usageLimitTotal === 0 ? "Không giới hạn" : record.usageLimitTotal ? `${record.usedCount ?? 0}/${record.usageLimitTotal}` : "-"}
        </div>
        <div>Mỗi user: {record.usageLimitPerUser === 0 ? "Không giới hạn" : record.usageLimitPerUser ?? "-"}</div>
      </div>
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    key: "isActive",
    width: 120,
    render: (isActive) => <Tag color={isActive ? "green" : "red"}>{isActive ? "Hoạt động" : "Không hoạt động"}</Tag>,
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 120,
    fixed: "right",
    render: (_, record) => (
      <Space>
        <Button type="link" onClick={() => onExtend(record)}>
          Gia hạn
        </Button>
        <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>
          Sửa
        </Button>
        <Popconfirm
          title="Xóa voucher"
          description="Bạn có chắc chắn muốn xóa voucher này?"
          onConfirm={() => onDelete(record.id ?? 0)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            Xóa
          </Button>
        </Popconfirm>
      </Space>
    ),
  },
];
