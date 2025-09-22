"use client";

import { useDetailCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import { ApiError } from "@/lib/axios";
import { UpdateCustomerRequest } from "@/types-openapi/api";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, Space, message, DatePicker, Select, Row, Col, FormProps } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useEffect } from "react";
import dayjs from "dayjs";

interface UpdateCustomerDrawerProps {
  open: boolean;
  onClose: () => void;
  customerId: number;
}

const UpdateCustomerDrawer = ({ open, onClose, customerId }: UpdateCustomerDrawerProps) => {
  const [form] = Form.useForm();

  // Fetch customer detail
  const { data: detailData, isFetching: loadingDetail, refetch } = useDetailCustomer({ id: customerId });

  // Mutation for update
  const updateMutation = useUpdateCustomer();

  // Populate form when detail is loaded
  useEffect(() => {
    if (!detailData?.data || !open) return;
    const d = detailData.data;

    form.setFieldsValue({
      fullName: d.fullName ?? null,
      phoneNumber: d.phoneNumber ?? null,
      email: d.email ?? null,
      dateOfBirth: d.dateOfBirth ? dayjs(d.dateOfBirth) : null,
      gender: d.gender ?? null,
      address: d.address ?? null,
      city: d.city ?? null,
      district: d.district ?? null,
      ward: d.ward ?? null,
      idCard: d.idCard ?? null,
      note: d.note ?? null,
    });
  }, [detailData, form, open]);

  // Refetch detail whenever opening to avoid stale cache
  useEffect(() => {
    if (open && customerId) {
      refetch();
    }
  }, [open, customerId, refetch]);

  const handleSubmit: FormProps<UpdateCustomerRequest>["onFinish"] = (values) => {
    const payload: UpdateCustomerRequest = {
      ...values,
      id: customerId,
    };
    updateMutation.mutate(payload, {
      onSuccess: () => {
        message.success("Cập nhật khách hàng thành công!");
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
  };

  return (
    <Drawer
      title="Cập nhật khách hàng"
      closable={{ "aria-label": "Close Button" }}
      onClose={() => {
        form.resetFields();
        onClose();
      }}
      open={open}
      width={600}
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
          <Button onClick={() => form.submit()} type="primary" icon={<SaveOutlined />} loading={updateMutation.isPending} disabled={loadingDetail}>
            Lưu thay đổi
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <FormItem<UpdateCustomerRequest>
              name="fullName"
              label="Họ và tên"
              rules={[
                { required: true, message: "Họ và tên là bắt buộc" },
                { min: 2, message: "Họ và tên phải có ít nhất 2 ký tự" },
                { max: 100, message: "Họ và tên không được quá 100 ký tự" },
              ]}
            >
              <Input placeholder="Nhập họ và tên" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<UpdateCustomerRequest>
              name="phoneNumber"
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
            <FormItem<UpdateCustomerRequest>
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
            <FormItem<UpdateCustomerRequest> name="gender" label="Giới tính">
              <Select placeholder="Chọn giới tính" allowClear>
                <Select.Option value="Nam">Nam</Select.Option>
                <Select.Option value="Nữ">Nữ</Select.Option>
                <Select.Option value="Khác">Khác</Select.Option>
              </Select>
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <FormItem<UpdateCustomerRequest> name="dateOfBirth" label="Ngày sinh">
              <DatePicker placeholder="Chọn ngày sinh" style={{ width: "100%" }} format="DD/MM/YYYY" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<UpdateCustomerRequest> name="idCard" label="Số CMND/CCCD">
              <Input placeholder="Nhập số CMND/CCCD" />
            </FormItem>
          </Col>
        </Row>

        <FormItem<UpdateCustomerRequest> name="address" label="Địa chỉ">
          <Input placeholder="Nhập địa chỉ" />
        </FormItem>

        <Row gutter={16}>
          <Col span={8}>
            <FormItem<UpdateCustomerRequest> name="city" label="Thành phố/Tỉnh">
              <Input placeholder="Nhập thành phố/tỉnh" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<UpdateCustomerRequest> name="district" label="Quận/Huyện">
              <Input placeholder="Nhập quận/huyện" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<UpdateCustomerRequest> name="ward" label="Phường/Xã">
              <Input placeholder="Nhập phường/xã" />
            </FormItem>
          </Col>
        </Row>

        <FormItem<UpdateCustomerRequest> name="note" label="Ghi chú">
          <Input.TextArea placeholder="Nhập ghi chú" rows={3} />
        </FormItem>
      </Form>
    </Drawer>
  );
};

export default UpdateCustomerDrawer;
