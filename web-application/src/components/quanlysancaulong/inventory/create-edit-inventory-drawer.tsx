"use client";

import React, { useEffect } from "react";
import { Button, Col, Drawer, Form, Input, Row, Select, Divider, message, Space, DatePicker } from "antd";
import { SaveOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { useCreateInventoryCheck, useUpdateInventoryCheck, useDetailInventoryCheck, useDeleteInventoryCheck } from "@/hooks/useInventory";
import { InventoryCheckStatus, CreateInventoryCheckRequest } from "@/types-openapi/api";

interface CreateEditInventoryDrawerProps {
  open: boolean;
  onClose: () => void;
  inventoryId?: number;
}

const statusLabels = {
  [InventoryCheckStatus.NUMBER_0]: "Chờ kiểm kê",
  [InventoryCheckStatus.NUMBER_1]: "Đang kiểm kê",
  [InventoryCheckStatus.NUMBER_2]: "Đã hủy",
};

const CreateEditInventoryDrawer: React.FC<CreateEditInventoryDrawerProps> = ({ open, onClose, inventoryId }) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const isEdit = !!inventoryId;
  const { data: inventoryData } = useDetailInventoryCheck(inventoryId!, isEdit && !!inventoryId);
  const createMutation = useCreateInventoryCheck();
  const updateMutation = useUpdateInventoryCheck();
  const deleteMutation = useDeleteInventoryCheck();

  useEffect(() => {
    if (open) {
      if (isEdit && inventoryData?.data) {
        const data = inventoryData.data;
        form.setFieldsValue({
          code: data.code,
          note: data.note,
          status: data.status,
          checkTime: data.checkTime ? new Date(data.checkTime) : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, isEdit, inventoryData, form]);

  const onFinish = async (values: any) => {
    try {
      const inventoryCheckData: CreateInventoryCheckRequest = {
        checkTime: values.checkTime,
        note: values.note,
        items: values.items,
      } as any;

      if (isEdit && inventoryId) {
        await updateMutation.mutateAsync({ id: inventoryId, data: inventoryCheckData });
      } else {
        await createMutation.mutateAsync(inventoryCheckData);
      }

      form.resetFields();
      onClose();
    } catch {
      messageApi.error(isEdit ? "Cập nhật phiếu kiểm kê thất bại!" : "Tạo phiếu kiểm kê thất bại!");
    }
  };

  const handleDelete = () => {
    if (!inventoryId) return;

    deleteMutation.mutate(inventoryId, {
      onSuccess: () => {
        onClose();
      },
      onError: () => {
        messageApi.error("Xóa phiếu kiểm kê thất bại!");
      },
    });
  };

  const title = isEdit ? "Chỉnh sửa phiếu kiểm kê" : "Thêm phiếu kiểm kê mới";

  return (
    <>
      {contextHolder}
      <Drawer
        title={title}
        width={600}
        onClose={onClose}
        open={open}
        styles={{ body: { paddingBottom: 80 } }}
        footer={
          <div className="text-right">
            <Space>
              <Button onClick={onClose} icon={<CloseOutlined />}>
                Đóng
              </Button>
              {isEdit && (
                <Button danger onClick={handleDelete} loading={deleteMutation.isPending} icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              )}
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={createMutation.isPending || updateMutation.isPending}
                icon={<SaveOutlined />}
              >
                {isEdit ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="Mã kiểm kê" rules={[{ required: true, message: "Vui lòng nhập mã kiểm kê!" }]}>
                <Input placeholder="Nhập mã kiểm kê" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="checkTime" label="Ngày kiểm kê" rules={[{ required: true, message: "Vui lòng chọn ngày kiểm kê!" }]}>
                <DatePicker style={{ width: "100%" }} placeholder="Chọn ngày kiểm kê" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}>
                <Select placeholder="Chọn trạng thái">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <Select.Option key={key} value={parseInt(key)}>
                      {label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={4} placeholder="Nhập ghi chú cho phiếu kiểm kê" />
          </Form.Item>
        </Form>

        <Divider />

        <div className="text-sm text-gray-500">
          <p>Lưu ý:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Mã kiểm kê phải là duy nhất trong hệ thống</li>
            <li>Ngày kiểm kê không được trước ngày hiện tại</li>
            <li>Trạng thái sẽ được cập nhật tự động theo quy trình kiểm kê</li>
          </ul>
        </div>
      </Drawer>
    </>
  );
};

export default CreateEditInventoryDrawer;
