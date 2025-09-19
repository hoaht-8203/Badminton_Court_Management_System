"use client";

import { useListRoles } from "@/hooks";
import { useCreateAdministrator } from "@/hooks/useUsers";
import { ApiError } from "@/lib/axios";
import { CreateAdministratorRequest } from "@/types-openapi/api";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, DatePicker, Drawer, Form, Input, Row, Select, Space, message } from "antd";
import FormItem from "antd/es/form/FormItem";

interface CreateNewUserDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateNewUserDrawer = ({ open, onClose }: CreateNewUserDrawerProps) => {
  const [form] = Form.useForm();

  const { data: rolesData, isFetching: loadingRolesData } = useListRoles({
    roleName: null,
  });
  const createMutation = useCreateAdministrator();

  const handleSubmit = async () => {
    const values = await form.validateFields();

    createMutation.mutate(values, {
      onSuccess: () => {
        message.success("Tạo người dùng thành công!");
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
      title="Thêm người dùng"
      closable={{ "aria-label": "Close Button" }}
      onClose={() => {
        form.resetFields();
        onClose();
      }}
      open={open}
      width={720}
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
            Thêm người dùng
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <FormItem<CreateAdministratorRequest>
              name="userName"
              label="Tên người dùng"
              rules={[{ required: true, message: "Tên người dùng là bắt buộc" }]}
            >
              <Input placeholder="Nhập tên người dùng" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<CreateAdministratorRequest>
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
        <Row gutter={16}>
          <Col span={12}>
            <FormItem<CreateAdministratorRequest> name="fullName" label="Họ và tên" rules={[{ required: true, message: "Họ và tên là bắt buộc" }]}>
              <Input placeholder="Nhập họ và tên" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<CreateAdministratorRequest>
              name="phoneNumber"
              label="Số điện thoại"
              rules={[{ required: true, message: "Số điện thoại là bắt buộc" }]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <FormItem<CreateAdministratorRequest>
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: "Mật khẩu là bắt buộc" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              name="confirmPassword"
              label="Nhập lại mật khẩu"
              rules={[
                { required: true, message: "Mật khẩu xác nhận là bắt buộc" },
                {
                  validator: (_, value) => {
                    if (value !== form.getFieldValue("password")) {
                      return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input.Password placeholder="Nhập lại mật khẩu" />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <FormItem<CreateAdministratorRequest> name="role" label="Vai trò" rules={[{ required: true, message: "Vai trò là bắt buộc" }]}>
              <Select
                placeholder="Chọn vai trò"
                options={rolesData?.data?.map((role) => ({
                  value: role.roleName,
                  label: role.roleName,
                }))}
                loading={loadingRolesData}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<CreateAdministratorRequest> name="dateOfBirth" label="Ngày sinh">
              <DatePicker style={{ width: "100%" }} placeholder="Chọn ngày sinh" format="DD/MM/YYYY" />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <FormItem<CreateAdministratorRequest> name="address" label="Địa chỉ">
              <Input placeholder="Nhập địa chỉ" />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <FormItem<CreateAdministratorRequest> name="city" label="Thành phố">
              <Input placeholder="Nhập thành phố" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<CreateAdministratorRequest> name="district" label="Quận/Huyện">
              <Input placeholder="Nhập quận/huyện" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<CreateAdministratorRequest> name="ward" label="Phường/Xã">
              <Input placeholder="Nhập phường/xã" />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <FormItem<CreateAdministratorRequest> name="note" label="Ghi chú">
              <Input.TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
            </FormItem>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default CreateNewUserDrawer;
