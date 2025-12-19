"use client";

import { useCreateSupplier } from "@/hooks/useSuppliers";
import { ApiError } from "@/lib/axios";
import { CreateSupplierRequest } from "@/types-openapi/api";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, Space, message, Row, Col, FormProps } from "antd";
import FormItem from "antd/es/form/FormItem";

interface CreateNewSupplierDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateNewSupplierDrawer = ({ open, onClose }: CreateNewSupplierDrawerProps) => {
  const [form] = Form.useForm();
  const createMutation = useCreateSupplier();

  const handleSubmit: FormProps<CreateSupplierRequest>["onFinish"] = (values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        message.success("Tạo nhà cung cấp thành công!");
        form.resetFields();
        onClose();
      },
      onError: (error: ApiError) => {
        // Hiển thị message lỗi chính
        message.error(error.message || "Có lỗi xảy ra khi tạo nhà cung cấp");

        // Set lỗi vào field tương ứng nếu có
        if (error.message?.toLowerCase().includes("email")) {
          form.setFields([{ name: "email", errors: [error.message] }]);
        } else if (error.message?.toLowerCase().includes("số điện thoại") || error.message?.toLowerCase().includes("phone")) {
          form.setFields([{ name: "phone", errors: [error.message] }]);
        }

        // Xử lý lỗi từ error.errors nếu có
        if (error.errors) {
          for (const key in error.errors) {
            const fieldName = key.toLowerCase();
            if (fieldName === "email" || fieldName === "phone" || fieldName === "name") {
              form.setFields([{ name: fieldName, errors: [error.errors[key]] }]);
            }
          }
        }
      },
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title="Thêm nhà cung cấp"
      closable={{ "aria-label": "Close Button" }}
      onClose={handleCancel}
      open={open}
      width={600}
      extra={
        <Space>
          <Button onClick={handleCancel} icon={<CloseOutlined />}>
            Hủy
          </Button>
          <Button type="primary" onClick={() => form.submit()} htmlType="submit" icon={<PlusOutlined />} loading={createMutation.isPending}>
            Thêm nhà cung cấp
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <FormItem<CreateSupplierRequest>
              name="name"
              label="Tên nhà cung cấp"
              rules={[{ required: true, message: "Tên nhà cung cấp là bắt buộc" }]}
            >
              <Input placeholder="Nhập tên nhà cung cấp" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<CreateSupplierRequest>
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: "Số điện thoại là bắt buộc" },
                { pattern: /^[0-9]{10,11}$/, message: "Số điện thoại không hợp lệ" },
              ]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <FormItem<CreateSupplierRequest>
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Email là bắt buộc" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input placeholder="Nhập email" />
            </FormItem>
          </Col>
        </Row>

        <FormItem<CreateSupplierRequest> name="address" label="Địa chỉ">
          <Input placeholder="Nhập địa chỉ" />
        </FormItem>

        <Row gutter={16}>
          <Col span={8}>
            <FormItem<CreateSupplierRequest> name="city" label="Thành phố/Tỉnh">
              <Input placeholder="Nhập thành phố/tỉnh" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<CreateSupplierRequest> name="district" label="Quận/Huyện">
              <Input placeholder="Nhập quận/huyện" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<CreateSupplierRequest> name="ward" label="Phường/Xã">
              <Input placeholder="Nhập phường/xã" />
            </FormItem>
          </Col>
        </Row>

        <FormItem<CreateSupplierRequest> name="notes" label="Ghi chú">
          <Input.TextArea placeholder="Nhập ghi chú" rows={3} />
        </FormItem>
      </Form>
    </Drawer>
  );
};

export default CreateNewSupplierDrawer;
