"use client";

import { useCreateMembership } from "@/hooks/useMembership";
import { ApiError } from "@/lib/axios";
import { CreateMembershipRequest } from "@/types-openapi/api";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, FormProps, Input, InputNumber, Select, Space, message } from "antd";
import FormItem from "antd/es/form/FormItem";

interface CreateNewMembershipDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateNewMembershipDrawer = ({ open, onClose }: CreateNewMembershipDrawerProps) => {
  const [form] = Form.useForm<CreateMembershipRequest>();
  const createMutation = useCreateMembership();

  const handleSubmit: FormProps<CreateMembershipRequest>["onFinish"] = (values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        message.success("Tạo gói hội viên thành công!");
        form.resetFields();
        onClose();
      },
      onError: (error: ApiError) => {
        message.error(error.message);
      },
    });
  };

  return (
    <Drawer
      title="Thêm gói hội viên"
      closable={{ "aria-label": "Close Button" }}
      onClose={() => {
        form.resetFields();
        onClose();
      }}
      open={open}
      width={560}
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
          <Button type="primary" icon={<PlusOutlined />} loading={createMutation.isPending} onClick={() => form.submit()}>
            Thêm gói
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <FormItem<CreateMembershipRequest> name="name" label="Tên gói" rules={[{ required: true, message: "Tên gói là bắt buộc" }]}>
          <Input placeholder="Nhập tên gói" />
        </FormItem>
        <FormItem<CreateMembershipRequest> name="price" label="Giá" rules={[{ required: true, message: "Giá là bắt buộc" }]}>
          <InputNumber min={0} style={{ width: "100%" }} placeholder="Nhập giá" />
        </FormItem>
        <FormItem<CreateMembershipRequest>
          name="discountPercent"
          label="% giảm giá khi đặt sân"
          rules={[{ required: true, message: "% giảm giá là bắt buộc" }]}
        >
          <InputNumber min={0} max={100} style={{ width: "100%" }} placeholder="Nhập % giảm" />
        </FormItem>
        <FormItem<CreateMembershipRequest> name="durationDays" label="Thời hạn (ngày)" rules={[{ required: true, message: "Thời hạn là bắt buộc" }]}>
          <InputNumber min={1} style={{ width: "100%" }} placeholder="Nhập số ngày" />
        </FormItem>
        <FormItem<CreateMembershipRequest> name="description" label="Mô tả quyền lợi">
          <Input.TextArea rows={3} placeholder="Nhập mô tả" />
        </FormItem>
        <FormItem<CreateMembershipRequest> name="status" label="Trạng thái" initialValue="Active">
          <Select
            options={[
              { value: "Active", label: "Hoạt động" },
              { value: "Inactive", label: "Không hoạt động" },
            ]}
          />
        </FormItem>
      </Form>
    </Drawer>
  );
};

export default CreateNewMembershipDrawer;
