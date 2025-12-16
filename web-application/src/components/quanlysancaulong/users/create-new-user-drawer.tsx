"use client";

import { useListRoles } from "@/hooks";
import { useCreateAdministrator } from "@/hooks/useUsers";
import { ApiError } from "@/lib/axios";
import { CreateAdministratorRequest } from "@/types-openapi/api";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, DatePicker, Drawer, Form, FormProps, Input, Row, Select, Space, message, Switch } from "antd";
import { useListStaffs } from "@/hooks/useStaffs";
import React from "react";
import FormItem from "antd/es/form/FormItem";
import { getRoleLabel } from "@/constants/roleLabels";

interface CreateNewUserDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateNewUserDrawer = ({ open, onClose }: CreateNewUserDrawerProps) => {
  const [form] = Form.useForm();
  const [createForStaff, setCreateForStaff] = React.useState(false);
  const [selectedStaffId, setSelectedStaffId] = React.useState<number | null>(null);
  const { data: staffData, isFetching: loadingStaffData } = useListStaffs({});

  // Khi chọn nhân viên, tự động điền họ tên và số điện thoại
  React.useEffect(() => {
    if (createForStaff && selectedStaffId && staffData?.data) {
      const staff = staffData.data.find((s: any) => s.id === selectedStaffId);
      if (staff) {
        form.setFieldsValue({
          fullName: staff.fullName,
          phoneNumber: staff.phoneNumber,
        });
      }
    }
    // Nếu tắt công tắc hoặc bỏ chọn thì clear 2 trường này
    if (!createForStaff || !selectedStaffId) {
      form.setFieldsValue({
        fullName: undefined,
        phoneNumber: undefined,
      });
    }
  }, [createForStaff, selectedStaffId, staffData, form]);

  const { data: rolesData, isFetching: loadingRolesData } = useListRoles({
    roleName: null,
  });
  const createMutation = useCreateAdministrator();

  const handleSubmit: FormProps<CreateAdministratorRequest>["onFinish"] = (values) => {
    const payload = createForStaff && selectedStaffId ? { ...values, staffId: selectedStaffId } : values;
    createMutation.mutate(payload, {
      onSuccess: () => {
        message.success("Tạo người dùng thành công!");
        form.resetFields();
        setCreateForStaff(false);
        setSelectedStaffId(null);
        onClose();
      },
      onError: (error: ApiError) => {
        message.error("Có lỗi xảy ra: " + (error.message || "Unknown error"));
      },
    });
  };

  return (
    <Drawer
      forceRender
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
          <Button onClick={() => form.submit()} type="primary" icon={<PlusOutlined />} loading={createMutation.isPending}>
            Thêm người dùng
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <FormItem label="Tạo tài khoản cho nhân viên" style={{ marginBottom: 0 }}>
          <Switch checked={createForStaff} onChange={setCreateForStaff} />
        </FormItem>
        {createForStaff && (
          <FormItem label="Chọn nhân viên" required>
            <Select
              showSearch
              placeholder="Chọn nhân viên"
              optionFilterProp="children"
              loading={loadingStaffData}
              value={selectedStaffId ?? undefined}
              onChange={setSelectedStaffId}
              options={staffData?.data?.map((staff: any) => ({
                value: staff.id,
                label: staff.fullName,
              }))}
              style={{ width: "100%" }}
            />
          </FormItem>
        )}
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
              <Input placeholder="Nhập họ và tên" readOnly={createForStaff && !!selectedStaffId} />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<CreateAdministratorRequest>
              name="phoneNumber"
              label="Số điện thoại"
              rules={[{ required: true, message: "Số điện thoại là bắt buộc" }]}
            >
              <Input placeholder="Nhập số điện thoại" readOnly={createForStaff && !!selectedStaffId} />
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
                  label: getRoleLabel(role.roleName),
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
