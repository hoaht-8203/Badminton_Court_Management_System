"use client";

import { useListRoles } from "@/hooks";
import {
  useDetailAdministrator,
  useUpdateAdministrator,
} from "@/hooks/useUsers";
import { ApiError } from "@/lib/axios";
import { UpdateUserRequest } from "@/types-openapi/api";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  Row,
  Select,
  Space,
  message,
} from "antd";
import FormItem from "antd/es/form/FormItem";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useEffect } from "react";
dayjs.extend(utc);

interface UpdateUserDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

const { Option } = Select;

const UpdateUserDrawer = ({ open, onClose, userId }: UpdateUserDrawerProps) => {
  const [form] = Form.useForm();

  // Fetch roles for select options
  const { data: rolesData, isFetching: loadingRolesData } = useListRoles({
    roleName: null,
  });

  // Fetch user detail
  const {
    data: detailData,
    isFetching: loadingDetail,
    refetch,
  } = useDetailAdministrator({ userId });

  // Mutation for update
  const updateMutation = useUpdateAdministrator();

  // Populate form when detail is loaded
  useEffect(() => {
    if (!detailData?.data || !open) return;
    const d = detailData.data;

    form.setFieldsValue({
      userName: d.userName ?? null,
      fullName: d.fullName ?? null,
      email: d.email ?? null,
      phoneNumber: d.phoneNumber ?? null,
      role: d.role?.[0] ?? null,
      address: d.address ?? null,
      city: d.city ?? null,
      district: d.district ?? null,
      ward: d.ward ?? null,
      dateOfBirth: d.dateOfBirth ? dayjs(d.dateOfBirth) : null,
      note: d.note ?? null,
    });
  }, [detailData, form, open]);

  // Refetch detail whenever opening to avoid stale cache
  useEffect(() => {
    if (open && userId) {
      refetch();
    }
  }, [open, userId, refetch]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload: UpdateUserRequest = {
        userId,
        userName: values.userName ?? null,
        fullName: values.fullName ?? null,
        email: values.email ?? null,
        password: values.password ?? null,
        phoneNumber: values.phoneNumber ?? null,
        role: values.role ?? null,
        address: values.address ?? undefined,
        city: values.city ?? undefined,
        district: values.district ?? undefined,
        ward: values.ward ?? undefined,
        dateOfBirth: values.dateOfBirth
          ? dayjs(values.dateOfBirth).utc(true).toDate()
          : undefined,
        note: values.note ?? undefined,
      };

      updateMutation.mutate(payload, {
        onSuccess: () => {
          message.success("Cập nhật người dùng thành công!");
          form.resetFields();
          onClose();
        },
        onError: (error: ApiError) => {
          for (const key in error.errors) {
            message.error(error.errors[key]);
            form.setFields([{ name: key, errors: [error.errors[key]] }]);
          }
        },
      });
    } catch (error: any) {
      // Validation errors are handled by antd form
    }
  };

  return (
    <Drawer
      title="Cập nhật người dùng"
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
          <Button
            onClick={handleSubmit}
            type="primary"
            icon={<SaveOutlined />}
            loading={updateMutation.isPending}
            disabled={loadingDetail}
          >
            Lưu thay đổi
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <FormItem<UpdateUserRequest>
              name="userName"
              label="Tên người dùng"
              rules={[
                { required: true, message: "Tên người dùng là bắt buộc" },
              ]}
            >
              <Input placeholder="Nhập tên người dùng" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<UpdateUserRequest>
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
          <Col span={12}>
            <FormItem<UpdateUserRequest>
              name="fullName"
              label="Họ và tên"
              rules={[{ required: true, message: "Họ và tên là bắt buộc" }]}
            >
              <Input placeholder="Nhập họ và tên" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<UpdateUserRequest>
              name="phoneNumber"
              label="Số điện thoại"
              rules={[{ required: true, message: "Số điện thoại là bắt buộc" }]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<UpdateUserRequest>
              name="password"
              label="Mật khẩu (để trống nếu không đổi)"
              rules={[{ min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" }]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              name="confirmPassword"
              label="Nhập lại mật khẩu (để trống nếu không đổi)"
              rules={[
                {
                  validator: (_, value) => {
                    if (value !== form.getFieldValue("password")) {
                      return Promise.reject(
                        new Error("Mật khẩu xác nhận không khớp")
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input.Password placeholder="Nhập lại mật khẩu mới" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<UpdateUserRequest>
              name="role"
              label="Vai trò"
              rules={[{ required: true, message: "Vai trò là bắt buộc" }]}
            >
              <Select
                placeholder="Chọn vai trò"
                options={rolesData?.data?.map((r) => ({
                  value: r.roleName,
                  label: r.roleName,
                }))}
                loading={loadingRolesData}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<UpdateUserRequest> name="dateOfBirth" label="Ngày sinh">
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Chọn ngày sinh"
              />
            </FormItem>
          </Col>
          <Col span={24}>
            <FormItem<UpdateUserRequest> name="address" label="Địa chỉ">
              <Input placeholder="Nhập địa chỉ" />
            </FormItem>
          </Col>

          <Col span={8}>
            <FormItem<UpdateUserRequest> name="city" label="Thành phố">
              <Input placeholder="Nhập thành phố" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<UpdateUserRequest> name="district" label="Quận/Huyện">
              <Input placeholder="Nhập quận/huyện" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<UpdateUserRequest> name="ward" label="Phường/Xã">
              <Input placeholder="Nhập phường/xã" />
            </FormItem>
          </Col>
          <Col span={24}>
            <FormItem<UpdateUserRequest> name="note" label="Ghi chú">
              <Input.TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
            </FormItem>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default UpdateUserDrawer;
