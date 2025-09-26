"use client";

import { useCreateCourtArea } from "@/hooks/useCourtArea";
import { ApiError } from "@/lib/axios";
import { CreateCourtAreaRequest } from "@/types-openapi/api";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, Space, message, FormProps } from "antd";
import FormItem from "antd/es/form/FormItem";

interface CreateNewCourtAreaDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateNewCourtAreaDrawer = ({ open, onClose }: CreateNewCourtAreaDrawerProps) => {
  const [form] = Form.useForm<CreateCourtAreaRequest>();
  const createMutation = useCreateCourtArea();

  const handleSubmit: FormProps<CreateCourtAreaRequest>["onFinish"] = (values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        message.success("Tạo khu vực sân thành công!");
        form.resetFields();
        onClose();
      },
      onError: (error: ApiError) => {
        message.error(error.message);
      },
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title="Thêm khu vực sân"
      closable={{ "aria-label": "Close Button" }}
      onClose={handleCancel}
      open={open}
      width={480}
      extra={
        <Space>
          <Button onClick={handleCancel} icon={<CloseOutlined />}>
            Hủy
          </Button>
          <Button type="primary" onClick={() => form.submit()} htmlType="submit" icon={<PlusOutlined />} loading={createMutation.isPending}>
            Thêm khu vực
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <FormItem<CreateCourtAreaRequest> name="name" label="Tên khu vực" rules={[{ required: true, message: "Tên khu vực là bắt buộc" }]}>
          <Input placeholder="Nhập tên khu vực" />
        </FormItem>
      </Form>
    </Drawer>
  );
};

export default CreateNewCourtAreaDrawer;
