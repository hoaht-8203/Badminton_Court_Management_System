import React, { useEffect } from "react";
import { Modal, Form, Input, DatePicker, Select, Button, Space, Row, Col } from "antd";
import dayjs from "dayjs";
import type { InventoryCheck } from "@/types-openapi/api";
import { useCreateInventoryCheck, useUpdateInventoryCheck } from "@/hooks/useInventory";

const { TextArea } = Input;
const { Option } = Select;

interface CreateEditInventoryModalProps {
  visible: boolean;
  onCancel: () => void;
  editingRecord?: InventoryCheck | null;
}

interface FormValues {
  code: string;
  checkTime: dayjs.Dayjs;
  status: number;
  note?: string;
}

const CreateEditInventoryModal: React.FC<CreateEditInventoryModalProps> = ({ visible, onCancel, editingRecord }) => {
  const [form] = Form.useForm<FormValues>();
  const createMutation = useCreateInventoryCheck();
  const updateMutation = useUpdateInventoryCheck();

  const isEdit = !!editingRecord;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (visible) {
      if (editingRecord) {
        // Edit mode - populate form with existing data
        form.setFieldsValue({
          code: editingRecord.code || "",
          checkTime: editingRecord.checkTime ? dayjs(editingRecord.checkTime) : dayjs(),
          status: editingRecord.status ?? 0,
          note: editingRecord.note || "",
        });
      } else {
        // Create mode - generate new code and set defaults
        const newCode = `INV${String(Date.now()).slice(-6)}`;
        form.setFieldsValue({
          code: newCode,
          checkTime: dayjs(),
          status: 0,
          note: "",
        });
      }
    } else {
      // Reset form when modal closes
      form.resetFields();
    }
  }, [visible, editingRecord, form]);

  const handleSubmit = async (values: FormValues) => {
    try {
      const submitData = {
        code: values.code,
        checkTime: values.checkTime.toDate(),
        status: values.status,
        note: values.note,
      } as any;

      if (isEdit && editingRecord?.id) {
        await updateMutation.mutateAsync({
          id: editingRecord.id,
          data: submitData,
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }

      onCancel(); // Close modal on success
    } catch (error) {
      // Error is already handled in the mutation hooks
      console.error("Submit error:", error);
    }
  };

  const statusOptions = [
    { label: "Chờ kiểm kê", value: 0 },
    { label: "Đã hoàn thành", value: 1 },
  ];

  return (
    <Modal title={isEdit ? "Sửa phiếu kiểm kê" : "Tạo phiếu kiểm kê mới"} open={visible} onCancel={onCancel} footer={null} width={600} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={isLoading}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="code"
              label="Mã kiểm kê"
              rules={[
                { required: true, message: "Vui lòng nhập mã kiểm kê" },
                { min: 3, message: "Mã kiểm kê phải có ít nhất 3 ký tự" },
              ]}
            >
              <Input placeholder="Nhập mã kiểm kê" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="checkTime" label="Thời gian kiểm kê" rules={[{ required: true, message: "Vui lòng chọn thời gian kiểm kê" }]}> 
              <DatePicker showTime format="DD/MM/YYYY HH:mm" placeholder="Chọn thời gian" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}> 
              <Select placeholder="Chọn trạng thái">
                {statusOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="note" label="Ghi chú">
          <TextArea placeholder="Nhập ghi chú (tùy chọn)" rows={4} />
        </Form.Item>

        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              {isEdit ? "Cập nhật" : "Tạo mới"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateEditInventoryModal;
