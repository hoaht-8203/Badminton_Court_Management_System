"use client";

import { useDetailService, useUpdateService } from "@/hooks/useServices";
import { ApiError } from "@/lib/axios";
import { UpdateServiceRequest } from "@/types-openapi/api";
import { fileService } from "@/services/fileService";
import { CloseOutlined, SaveOutlined, UploadOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, Space, message, Select, Row, Col, FormProps, InputNumber, Upload, Image, Spin } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useEffect, useState } from "react";

interface UpdateServiceDrawerProps {
  open: boolean;
  onClose: () => void;
  serviceId: string;
}

const UpdateServiceDrawer = ({ open, onClose, serviceId }: UpdateServiceDrawerProps) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);

  // Fetch service detail
  const { data: detailData, isFetching: loadingDetail, refetch } = useDetailService({ id: serviceId });

  // Mutation for update
  const updateMutation = useUpdateService();

  // Populate form when detail is loaded
  useEffect(() => {
    if (!detailData?.data || !open) return;
    const d = detailData.data;

    form.setFieldsValue({
      code: d.code ?? null,
      name: d.name ?? null,
      description: d.description ?? null,
      pricePerHour: d.pricePerHour ?? null,
      category: d.category ?? null,
      unit: d.unit ?? null,
      stockQuantity: d.stockQuantity ?? null,
      note: d.note ?? null,
    });

    // Set image URL from service data
    setImageUrl(d.imageUrl ?? null);
    setImageFileName(null); // Reset file name since we're loading existing image
  }, [detailData, form, open]);

  // Refetch detail whenever opening to avoid stale cache
  useEffect(() => {
    if (open && serviceId) {
      refetch();
    }
  }, [open, serviceId, refetch]);

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
      if (imageFileName) {
        await fileService.deleteFile({ fileName: imageFileName });
      }
      setImageUrl(null);
      setImageFileName(null);
      message.success("Xóa ảnh thành công!");
    } catch (error) {
      message.error("Xóa ảnh thất bại: " + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit: FormProps<UpdateServiceRequest>["onFinish"] = (values) => {
    const payload: UpdateServiceRequest = {
      ...values,
      id: serviceId,
      imageUrl: imageUrl,
    };
    updateMutation.mutate(payload, {
      onSuccess: () => {
        message.success("Cập nhật dịch vụ thành công!");
        form.resetFields();
        setImageUrl(null);
        setImageFileName(null);
        setUploading(false);
        onClose();
      },
      onError: (error: ApiError) => {
        // Hiển thị message lỗi chính
        message.error(error.message || "Có lỗi xảy ra khi cập nhật dịch vụ");

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

  return (
    <Drawer
      title="Cập nhật dịch vụ"
      closable={{ "aria-label": "Close Button" }}
      onClose={() => {
        form.resetFields();
        setImageUrl(null);
        setImageFileName(null);
        setUploading(false);
        onClose();
      }}
      open={open}
      width={800}
      extra={
        <Space>
          <Button
            onClick={() => {
              form.resetFields();
              setImageUrl(null);
              setImageFileName(null);
              setUploading(false);
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
            <FormItem<UpdateServiceRequest>
              name="code"
              label="Mã dịch vụ"
              rules={[
                { required: true, message: "Mã dịch vụ là bắt buộc" },
                { min: 2, message: "Mã dịch vụ phải có ít nhất 2 ký tự" },
                { max: 50, message: "Mã dịch vụ không được quá 50 ký tự" },
              ]}
            >
              <Input placeholder="Nhập mã dịch vụ" />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem<UpdateServiceRequest> name="category" label="Danh mục" rules={[{ required: true, message: "Danh mục là bắt buộc" }]}>
              <Select placeholder="Chọn danh mục">
                <Select.Option value="Equipment">Thiết bị</Select.Option>
                <Select.Option value="Referee">Trọng tài</Select.Option>
                <Select.Option value="Clothing">Quần áo</Select.Option>
                <Select.Option value="Other">Khác</Select.Option>
              </Select>
            </FormItem>
          </Col>

          <Col span={24}>
            <FormItem<UpdateServiceRequest>
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

          <Col span={12}>
            <FormItem<UpdateServiceRequest> name="unit" label="Đơn vị" rules={[{ required: true, message: "Đơn vị là bắt buộc" }]}>
              <Input placeholder="Nhập đơn vị (VD: cái, bộ, người)" />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem<UpdateServiceRequest>
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

          <Col span={12}>
            <FormItem<UpdateServiceRequest>
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
        </Row>

        <FormItem<UpdateServiceRequest> name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả dịch vụ" rows={3} />
        </FormItem>

        <FormItem<UpdateServiceRequest> name="note" label="Ghi chú">
          <Input.TextArea placeholder="Nhập ghi chú" rows={3} />
        </FormItem>

        <FormItem<UpdateServiceRequest> name="imageUrl" label="Ảnh dịch vụ">
          <Space direction="vertical" style={{ width: "100%" }}>
            {imageUrl ? (
              <Space>
                <div className="flex items-center justify-center border border-dashed border-gray-300 p-1">
                  <Image
                    src={imageUrl}
                    alt="Service preview"
                    style={{ width: 200, height: 200, objectFit: "cover" }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3IsRhnG4W+FgYxN"
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

export default UpdateServiceDrawer;
