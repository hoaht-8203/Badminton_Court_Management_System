"use client";

import { useGetHolidays, useUpdateHolidays } from "@/hooks/useSystemConfig";
import type { Holiday } from "@/services/systemConfigService";
import { CalendarOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Space,
  Tabs,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";

const { TextArea } = Input;
const { Title, Paragraph } = Typography;


export default function EmployeeConfigurationPage() {
  return (
    <section>
      <div className="mb-4">
        <Breadcrumb items={[{ title: "Quản trị ứng dụng" }, { title: "Thiết lập nhân viên" }]} />
      </div>

      <Tabs
        defaultActiveKey="holidays"
        items={[
          {
            key: "holidays",
            label: "Ngày nghỉ lễ",
            children: <HolidayManagement />,
          },
          {
            key: "shifts",
            label: "Ca làm việc",
            disabled: true,
            children: (
              <Card>
                <Title level={4}>Quản lý ca làm việc</Title>
                <Paragraph type="secondary">Đang phát triển...</Paragraph>
              </Card>
            ),
          },
          {
            key: "attendance",
            label: "Chấm công",
            disabled: true,
            children: (
              <Card>
                <Title level={4}>Cấu hình chấm công</Title>
                <Paragraph type="secondary">Đang phát triển...</Paragraph>
              </Card>
            ),
          },
        ]}
      />
    </section>
  );
}

function HolidayManagement() {
  const { data: holidays, isLoading } = useGetHolidays();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const handleOpenModal = (holiday?: Holiday) => {
    if (holiday) {
      setEditingHoliday(holiday);
    } else {
      setEditingHoliday(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHoliday(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    message.success(editingHoliday ? "Cập nhật ngày nghỉ lễ thành công" : "Thêm ngày nghỉ lễ thành công");
  };

  return (
    <Card
      title="Quản lý ngày nghỉ lễ"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Thêm ngày lễ
        </Button>
      }
    >
      <Paragraph type="secondary" className="mb-4">
        Cấu hình các ngày nghỉ lễ trong năm để tính toán lương và lịch làm việc
      </Paragraph>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : holidays && holidays.length > 0 ? (
        <div className="space-y-2">
          {holidays.map((holiday) => (
            <HolidayItem
              key={holiday.id}
              holiday={holiday}
              holidays={holidays}
              onEdit={() => handleOpenModal(holiday)}
            />
          ))}
        </div>
      ) : (
        <Empty
          image={<CalendarOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
          description={
            <div>
              <p>Chưa có ngày nghỉ lễ nào</p>
              <p className="text-sm text-gray-400">Nhấn vào nút "Thêm ngày lễ" để bắt đầu</p>
            </div>
          }
        />
      )}

      <HolidayModal
        open={isModalOpen}
        holiday={editingHoliday}
        holidays={holidays || []}
        onSuccess={handleSuccess}
        onCancel={handleCloseModal}
      />
    </Card>
  );
}

interface HolidayItemProps {
  holiday: Holiday;
  holidays: Holiday[];
  onEdit: () => void;
}

function HolidayItem({ holiday, holidays, onEdit }: HolidayItemProps) {
  const updateHolidays = useUpdateHolidays();
  const [modal, contextHolder] = Modal.useModal();

  const handleDelete = () => {
    modal.confirm({
      title: "Xác nhận",
      content: `Bạn có chắc chắn muốn xóa ngày lễ "${holiday.name}"?`,
      onOk: async () => {
        const updatedHolidays = holidays.filter((h) => h.id !== holiday.id);
        const result = await updateHolidays.mutateAsync(updatedHolidays);
        if (result.success) {
          message.success("Xóa ngày nghỉ lễ thành công");
        } else {
          message.error(result.message || "Xóa ngày nghỉ lễ thất bại");
        }
      },
      okText: "Xác nhận",
      cancelText: "Hủy",
    });
  };

  const formatDate = (dateStr: string) => {
    return dayjs(dateStr).format("DD/MM/YYYY");
  };

  return (
    <>
      <Card
        size="small"
        className="hover:bg-gray-50"
        extra={
          <Space>
            <Button type="text" icon={<EditOutlined />} onClick={onEdit} />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              loading={updateHolidays.isPending}
            />
          </Space>
        }
      >
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold">{holiday.name}</span>
            {holiday.isSpecialDay && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Ngày đặc biệt</span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {formatDate(holiday.startDate)} - {formatDate(holiday.endDate)}
          </p>
          {holiday.note && <p className="mt-1 text-sm text-gray-500">{holiday.note}</p>}
        </div>
      </Card>
      {contextHolder}
    </>
  );
}

interface HolidayModalProps {
  open: boolean;
  holiday: Holiday | null;
  holidays: Holiday[];
  onSuccess: () => void;
  onCancel: () => void;
}

function HolidayModal({ open, holiday, holidays, onSuccess, onCancel }: HolidayModalProps) {
  const isEdit = !!holiday;
  const updateHolidays = useUpdateHolidays();
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (values.startDate.isAfter(values.endDate)) {
        message.error("Ngày bắt đầu phải trước ngày kết thúc");
        return;
      }

      let updatedHolidays: Holiday[];

      if (isEdit && holiday) {
        updatedHolidays = holidays.map((h) =>
          h.id === holiday.id
            ? {
                ...h,
                name: values.name,
                startDate: values.startDate.format("YYYY-MM-DD"),
                endDate: values.endDate.format("YYYY-MM-DD"),
                isSpecialDay: values.isSpecialDay || false,
                note: values.note,
              }
            : h
        );
      } else {
        const newHoliday: Holiday = {
          id: crypto.randomUUID(),
          name: values.name,
          startDate: values.startDate.format("YYYY-MM-DD"),
          endDate: values.endDate.format("YYYY-MM-DD"),
          isSpecialDay: values.isSpecialDay || false,
          note: values.note,
        };
        updatedHolidays = [...holidays, newHoliday];
      }

      const result = await updateHolidays.mutateAsync(updatedHolidays);
      if (result.success) {
        form.resetFields();
        onSuccess();
      } else {
        message.error(result.message || (isEdit ? "Cập nhật thất bại" : "Thêm mới thất bại"));
      }
    } catch (error) {
      // Validation error
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Set initial values when modal opens
  const initialValues = holiday
    ? {
        name: holiday.name,
        startDate: dayjs(holiday.startDate),
        endDate: dayjs(holiday.endDate),
        isSpecialDay: holiday.isSpecialDay,
        note: holiday.note,
      }
    : {
        isSpecialDay: false,
      };

  return (
    <Modal
      title={isEdit ? "Chỉnh sửa ngày nghỉ lễ" : "Thêm ngày nghỉ lễ"}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={isEdit ? "Cập nhật" : "Thêm mới"}
      cancelText="Hủy"
      confirmLoading={updateHolidays.isPending}
      width={600}
      afterClose={() => form.resetFields()}
    >
      <Paragraph type="secondary" className="mb-4">
        {isEdit ? "Cập nhật thông tin ngày nghỉ lễ" : "Thêm ngày nghỉ lễ mới vào hệ thống"}
      </Paragraph>

      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          label="Tên ngày lễ"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên ngày lễ" }]}
        >
          <Input placeholder="VD: Tết Nguyên Đán, Quốc Khánh..." />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="Ngày bắt đầu"
            name="startDate"
            rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu" }]}
          >
            <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
          </Form.Item>

          <Form.Item
            label="Ngày kết thúc"
            name="endDate"
            rules={[{ required: true, message: "Vui lòng chọn ngày kết thúc" }]}
          >
            <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
          </Form.Item>
        </div>

        <Form.Item name="isSpecialDay" valuePropName="checked">
          <Checkbox>Ngày đặc biệt (hệ số lương cao hơn)</Checkbox>
        </Form.Item>

        <Form.Item label="Ghi chú" name="note">
          <TextArea rows={3} placeholder="Thêm ghi chú về ngày lễ này..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
