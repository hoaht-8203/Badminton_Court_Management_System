"use client";

import { useCreateCustomer } from "@/hooks/useCustomers";
import { ApiError } from "@/lib/axios";
import { CreateCustomerRequest } from "@/types-openapi/api";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, Space, message, DatePicker, Select, Row, Col } from "antd";
import FormItem from "antd/es/form/FormItem";
import dayjs from "dayjs";

interface CreateNewCustomerDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateNewCustomerDrawer = ({ open, onClose }: CreateNewCustomerDrawerProps) => {
  const [form] = Form.useForm();

  const createMutation = useCreateCustomer();

  const handleSubmit = async () => {
    const values = await form.validateFields();

    const payload: CreateCustomerRequest = {
      fullName: values.fullName,
      phoneNumber: values.phoneNumber,
      email: values.email,
      dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).toDate() : null,
      gender: values.gender || null,
      address: values.address || null,
      city: values.city || null,
      district: values.district || null,
      ward: values.ward || null,
      idCard: values.idCard || null,
      note: values.note || null,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        message.success("Tạo khách hàng thành công!");
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
      title="Thêm khách hàng"
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
          <Button onClick={handleSubmit} type="primary" icon={<PlusOutlined />} loading={createMutation.isPending}>
            Thêm khách hàng
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <FormItem<CreateCustomerRequest>
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
            <FormItem<CreateCustomerRequest>
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
            <FormItem<CreateCustomerRequest>
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
            <FormItem<CreateCustomerRequest> name="gender" label="Giới tính">
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
            <FormItem<CreateCustomerRequest> name="dateOfBirth" label="Ngày sinh">
              <DatePicker placeholder="Chọn ngày sinh" style={{ width: "100%" }} format="DD/MM/YYYY" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<CreateCustomerRequest> name="idCard" label="Số CMND/CCCD">
              <Input placeholder="Nhập số CMND/CCCD" />
            </FormItem>
          </Col>
        </Row>

        <FormItem<CreateCustomerRequest> name="address" label="Địa chỉ">
          <Input placeholder="Nhập địa chỉ" />
        </FormItem>

        <Row gutter={16}>
          <Col span={8}>
            <FormItem<CreateCustomerRequest> name="city" label="Thành phố/Tỉnh">
              <Input placeholder="Nhập thành phố/tỉnh" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<CreateCustomerRequest> name="district" label="Quận/Huyện">
              <Input placeholder="Nhập quận/huyện" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<CreateCustomerRequest> name="ward" label="Phường/Xã">
              <Input placeholder="Nhập phường/xã" />
            </FormItem>
          </Col>
        </Row>

        <FormItem<CreateCustomerRequest> name="note" label="Ghi chú">
          <Input.TextArea placeholder="Nhập ghi chú" rows={3} />
        </FormItem>
      </Form>
    </Drawer>
  );
};

export default CreateNewCustomerDrawer;
