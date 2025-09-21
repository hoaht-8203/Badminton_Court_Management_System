"use client";

import { useCreateRole } from "@/hooks/useRoles";
import { ApiError } from "@/lib/axios";
import { CreateRoleRequest } from "@/types-openapi/api";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, Space, message } from "antd";
import FormItem from "antd/es/form/FormItem";

interface CreateNewRoleDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateNewRoleDrawer = ({ open, onClose }: CreateNewRoleDrawerProps) => {
  const [form] = Form.useForm();

  const createMutation = useCreateRole();

  const handleSubmit = async () => {
    const values = await form.validateFields();

    createMutation.mutate(values, {
      onSuccess: () => {
        message.success("Tạo vai trò thành công!");
        form.resetFields();
        onClose();
      },
      onError: (error: ApiError) => {
        message.error("Có lỗi xảy ra: " + (error.message || "Unknown error"));
      },
    });
  };

  return (
    <Drawer
      title="Thêm vai trò"
      closable={{ "aria-label": "Close Button" }}
      onClose={() => {
        form.resetFields();
        onClose();
      }}
      open={open}
      width={500}
      extra={
        <Space>
          <Button
            onClick={() => {
              form.resetFields();
              onClose();
            }}
            icon={<CloseOutlined />}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} type="primary" icon={<PlusOutlined />} loading={createMutation.isPending}>
            Thêm vai trò
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <FormItem<CreateRoleRequest>
          name="roleName"
          label="Tên vai trò"
          rules={[
            { required: true, message: "Tên vai trò là bắt buộc" },
            { min: 2, message: "Tên vai trò phải có ít nhất 2 ký tự" },
            { max: 50, message: "Tên vai trò không được quá 50 ký tự" },
          ]}
        >
          <Input placeholder="Nhập tên vai trò" />
        </FormItem>
      </Form>
    </Drawer>
  );
};

export default CreateNewRoleDrawer;
