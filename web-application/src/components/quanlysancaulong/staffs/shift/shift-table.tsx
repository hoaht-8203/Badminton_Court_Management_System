import React from "react";
import { Table, Button, Switch, Space } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useShiftModal } from "@/components/quanlysancaulong/staffs/shift/shift-modal";

const columns = [
  {
    title: "Stt",
    dataIndex: "key",
    key: "key",
    align: "center" as const,
    width: 60,
    render: (text: any, record: any, index: number) => index + 1,
  },
  {
    title: "Ca làm việc",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Thời gian",
    dataIndex: "time",
    key: "time",
    render: (_: any, record: any) => {
      // Chuyển startTime, endTime sang dạng HH:mm
      const start = record.startTime?.slice(0, 5) ?? "";
      const end = record.endTime?.slice(0, 5) ?? "";
      return `${start} - ${end}`;
    },
  },
  {
    title: "Tổng giờ làm việc",
    dataIndex: "totalHours",
    key: "totalHours",
    align: "center" as const,
    render: (_: any, record: any) => {
      if (!record.startTime || !record.endTime) return "";
      const [startH, startM] = record.startTime.split(":").map(Number);
      const [endH, endM] = record.endTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const diff = endMinutes - startMinutes;
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      return minutes === 0 ? `${hours} giờ` : `${hours} giờ ${minutes} phút`;
    },
  },
  {
    title: "Hoạt động",
    dataIndex: "active",
    key: "active",
    align: "center" as const,
    render: (_: any, record: any) => <Switch checked={record.isActive} />,
  },
  {
    title: "",
    key: "actions",
    align: "center" as const,
    width: 100,
    render: (_: any, record: any) => (
      <Space>
        <Button icon={<EditOutlined />} type="text" onClick={() => record.onEdit?.(record)} />
        <Button icon={<DeleteOutlined />} type="text" danger onClick={() => record.onDelete?.(record)} />
      </Space>
    ),
  },
];

const ShiftTable = ({
  shiftData = [],
  isFetching = false,
  onAdd,
  onEdit,
  onDelete,
  onModalOk,
  modalLoading,
  onChangeStatus,
}: {
  shiftData?: any[];
  isFetching?: boolean;
  onAdd: () => void;
  onEdit: (record: any) => void;
  onDelete: (record: any) => void;
  onModalOk: (values: any) => void;
  modalLoading?: boolean;
  onChangeStatus?: (record: any) => void;
}) => {
  const { ModalComponent } = useShiftModal();

  // Gắn hàm onEdit, onDelete, onChangeStatus vào từng record
  const dataWithActions = shiftData.map((item) => ({ ...item, onEdit, onDelete, onChangeStatus }));

  // Sửa lại cột Hoạt động để gọi onChangeStatus
  const columnsWithStatus = columns.map((col) =>
    col.key === "active"
      ? {
          ...col,
          render: (_: any, record: any) => <Switch checked={record.isActive} onChange={() => record.onChangeStatus?.(record)} />,
        }
      : col,
  );

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 2px 8px #f0f1f2" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 18, color: "#222" }}>Danh sách ca làm việc</div>
        <Button type="primary" icon={<PlusOutlined />} style={{ background: "#1677ff", borderColor: "#1677ff", borderRadius: 6 }} onClick={onAdd}>
          Thêm ca làm việc
        </Button>
      </div>
      <Table
        columns={columnsWithStatus}
        dataSource={dataWithActions}
        loading={isFetching || modalLoading}
        pagination={false}
        rowKey={(record) => record.id ?? record.key}
        bordered
        style={{ borderRadius: 8 }}
      />
      <ModalComponent onOk={onModalOk} loading={modalLoading} />
    </div>
  );
};

export default ShiftTable;
