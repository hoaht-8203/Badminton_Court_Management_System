"use client";

import { useCreateCustomer } from "@/hooks/useCustomers";
import { ApiError } from "@/lib/axios";
import { CreateCustomerRequest } from "@/types-openapi/api";
import { fileService } from "@/services/fileService";
import { CloseOutlined, PlusOutlined, UploadOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, Space, message, DatePicker, Select, Row, Col, FormProps, Upload, Image, Spin } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useState } from "react";

interface CreateNewCustomerDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateNewCustomerDrawer = ({ open, onClose }: CreateNewCustomerDrawerProps) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFileName, setAvatarFileName] = useState<string | null>(null);

  const createMutation = useCreateCustomer();

  const handleSubmit: FormProps<CreateCustomerRequest>["onFinish"] = (values) => {
    const customerData = {
      ...values,
      avatarUrl: avatarUrl,
    };

    createMutation.mutate(customerData, {
      onSuccess: () => {
        message.success("Tạo khách hàng thành công!");
        form.resetFields();
        setAvatarUrl(null);
        setAvatarFileName(null);
        setUploading(false);
        onClose();
      },
      onError: (error: ApiError) => {
        message.error("Có lỗi xảy ra: " + (error.message || "Unknown error"));
      },
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await fileService.uploadFile(file);
      setAvatarUrl(url.data?.publicUrl ?? null);
      setAvatarFileName(url.data?.fileName ?? null);
      message.success("Upload ảnh thành công!");
      return false; // Prevent default upload behavior
    } catch (error) {
      message.error("Upload ảnh thất bại: " + (error as Error).message);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await fileService.deleteFile({ fileName: avatarFileName ?? "" });
      setAvatarUrl(null);
      setAvatarFileName(null);
      message.success("Xóa ảnh thành công!");
    } catch (error) {
      message.error("Xóa ảnh thất bại: " + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = async () => {
    try {
      if (avatarFileName) {
        await fileService.deleteFile({ fileName: avatarFileName });
      }
    } catch (error) {
      message.error("Xóa ảnh thất bại: " + (error as Error).message);
    } finally {
      form.resetFields();
      setAvatarUrl(null);
      setAvatarFileName(null);
      setUploading(false);
      onClose();
    }
  };

  return (
    <Drawer
      title="Thêm khách hàng"
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
            Thêm khách hàng
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
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

        <FormItem<CreateCustomerRequest> name="avatarUrl" label="Ảnh đại diện">
          <Space direction="vertical" style={{ width: "100%" }}>
            {avatarUrl ? (
              <Space>
                <div className="flex items-center justify-center border border-dashed border-gray-300 p-1">
                  <Image
                    src={avatarUrl}
                    alt="Avatar preview"
                    style={{ width: 200, height: 200, objectFit: "cover" }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                  />
                </div>
                <Button type="text" danger icon={<DeleteOutlined />} onClick={handleRemoveAvatar}>
                  Xóa ảnh
                </Button>
              </Space>
            ) : (
              <>
                {uploading ? (
                  <div className="flex h-[200px] w-[200px] items-center justify-center border border-gray-300">
                    <Spin indicator={<LoadingOutlined spin />} />
                  </div>
                ) : (
                  <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*" disabled={uploading}>
                    <Button icon={<UploadOutlined />} loading={uploading}>
                      {uploading ? "Đang upload..." : "Chọn ảnh đại diện"}
                    </Button>
                  </Upload>
                )}
              </>
            )}
            <div style={{ fontSize: "12px", color: "#666" }}>Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP). Kích thước tối đa 100MB.</div>
          </Space>
        </FormItem>
      </Form>
    </Drawer>
  );
};

export default CreateNewCustomerDrawer;
