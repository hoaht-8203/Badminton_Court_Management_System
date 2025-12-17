"use client";

import { useCreateService } from "@/hooks/useServices";
import { ApiError } from "@/lib/axios";
import { CreateServiceRequest } from "@/types-openapi/api";
import { fileService } from "@/services/fileService";
import { CloseOutlined, PlusOutlined, UploadOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, Space, message, Select, Row, Col, FormProps, Upload, Image, Spin, InputNumber } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useState } from "react";

interface CreateNewServiceDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateNewServiceDrawer = ({ open, onClose }: CreateNewServiceDrawerProps) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);

  const createMutation = useCreateService();

  const handleSubmit: FormProps<CreateServiceRequest>["onFinish"] = (values) => {
    const serviceData = {
      ...values,
      imageUrl: imageUrl,
    };

    createMutation.mutate(serviceData, {
      onSuccess: () => {
        message.success("Tạo dịch vụ thành công!");
        form.resetFields();
        setImageUrl(null);
        setImageFileName(null);
        setUploading(false);
        onClose();
      },
      onError: (error: ApiError) => {
        // Hiển thị message lỗi chính
        message.error(error.message || "Có lỗi xảy ra khi tạo dịch vụ");

        // Set lỗi vào field tương ứng nếu có
        if (error.message?.toLowerCase().includes("tên dịch vụ") || error.message?.toLowerCase().includes("name")) {
          form.setFields([{ name: "name", errors: [error.message] }]);
        }

        // Xử lý lỗi từ error.errors nếu có
        if (error.errors) {
          for (const key in error.errors) {
            const fieldName = key.toLowerCase();
            if (fieldName === "name" || fieldName === "code" || fieldName === "category") {
              form.setFields([{ name: fieldName, errors: [error.errors[key]] }]);
            }
          }
        }
      },
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await fileService.uploadFile(file);
      setImageUrl(url.data?.publicUrl ?? null);
      setImageFileName(url.data?.fileName ?? null);
      message.success("Upload ảnh thành công!");
      return false; // Prevent default upload behavior
    } catch (error) {
      message.error("Upload ảnh thất bại: " + (error as Error).message);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      await fileService.deleteFile({ fileName: imageFileName ?? "" });
      setImageUrl(null);
      setImageFileName(null);
      message.success("Xóa ảnh thành công!");
    } catch (error) {
      message.error("Xóa ảnh thất bại: " + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = async () => {
    try {
      if (imageFileName) {
        await fileService.deleteFile({ fileName: imageFileName });
      }
    } catch (error) {
      message.error("Xóa ảnh thất bại: " + (error as Error).message);
    } finally {
      form.resetFields();
      setImageUrl(null);
      setImageFileName(null);
      setUploading(false);
      onClose();
    }
  };

  return (
    <Drawer
      title="Thêm dịch vụ"
      closable={{ "aria-label": "Close Button" }}
      onClose={handleCancel}
      open={open}
      width={800}
      extra={
        <Space>
          <Button onClick={handleCancel} icon={<CloseOutlined />}>
            Hủy
          </Button>
          <Button type="primary" onClick={() => form.submit()} htmlType="submit" icon={<PlusOutlined />} loading={createMutation.isPending}>
            Thêm dịch vụ
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical" initialValues={{ isActive: true }}>
        <Row gutter={16}>
          <Col span={12}>
            <FormItem<CreateServiceRequest>
              name="code"
              label="Mã dịch vụ"
              rules={[
                { min: 2, message: "Mã dịch vụ phải có ít nhất 2 ký tự" },
                { max: 50, message: "Mã dịch vụ không được quá 50 ký tự" },
              ]}
            >
              <Input placeholder="Để trống để tự động tạo mã (VD: DV000001)" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<CreateServiceRequest> name="category" label="Danh mục" rules={[{ required: true, message: "Danh mục là bắt buộc" }]}>
              <Select placeholder="Chọn danh mục">
                <Select.Option value="Equipment">Thiết bị</Select.Option>
                <Select.Option value="Referee">Trọng tài</Select.Option>
                <Select.Option value="Clothing">Quần áo</Select.Option>
                <Select.Option value="Other">Khác</Select.Option>
              </Select>
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <FormItem<CreateServiceRequest>
              name="name"
              label="Tên dịch vụ"
              rules={[
                { required: true, message: "Tên dịch vụ là bắt buộc" },
                { min: 2, message: "Tên dịch vụ phải có ít nhất 2 ký tự" },
                { max: 100, message: "Tên dịch vụ không được quá 100 ký tự" },
              ]}
            >
              <Input placeholder="Nhập tên dịch vụ" />
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <FormItem<CreateServiceRequest> name="unit" label="Đơn vị" rules={[{ required: true, message: "Đơn vị là bắt buộc" }]}>
              <Input placeholder="Nhập đơn vị (VD: cái, bộ, người)" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<CreateServiceRequest>
              name="stockQuantity"
              label="Số lượng"
              rules={[
                { required: true, message: "Số lượng là bắt buộc" },
                { type: "number", min: 0, message: "Số lượng phải lớn hơn hoặc bằng 0" },
              ]}
            >
              <InputNumber placeholder="Nhập số lượng" style={{ width: "100%" }} min={0} />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem<CreateServiceRequest>
              name="pricePerHour"
              label="Giá/giờ (VND)"
              rules={[
                { required: true, message: "Giá/giờ là bắt buộc" },
                { type: "number", min: 0, message: "Giá/giờ phải lớn hơn hoặc bằng 0" },
              ]}
            >
              <InputNumber
                placeholder="Nhập giá/giờ"
                style={{ width: "100%" }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              />
            </FormItem>
          </Col>
        </Row>

        <FormItem<CreateServiceRequest> name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả dịch vụ" rows={3} />
        </FormItem>

        <FormItem<CreateServiceRequest> name="note" label="Ghi chú">
          <Input.TextArea placeholder="Nhập ghi chú" rows={3} />
        </FormItem>

        <FormItem<CreateServiceRequest> name="imageUrl" label="Ảnh dịch vụ">
          <Space direction="vertical" style={{ width: "100%" }}>
            {imageUrl ? (
              <Space>
                <div className="flex items-center justify-center border border-dashed border-gray-300 p-1">
                  <Image
                    src={imageUrl}
                    alt="Service preview"
                    style={{ width: 200, height: 200, objectFit: "cover" }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                  />
                </div>
                <Button type="text" danger icon={<DeleteOutlined />} onClick={handleRemoveImage}>
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
                      {uploading ? "Đang upload..." : "Chọn ảnh dịch vụ"}
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

export default CreateNewServiceDrawer;
