"use client";

import { useCreateSlider, useListSliders } from "@/hooks/useSlider";
import { ApiError } from "@/lib/axios";
import { fileService } from "@/services/fileService";
import { CreateSliderRequest } from "@/types-openapi/api";
import { DeleteOutlined, LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Image, Input, message, Space, Spin, Upload } from "antd";
import { useEffect, useState } from "react";

interface CreateSliderDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateSliderDrawer = ({ open, onClose }: CreateSliderDrawerProps) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const createSliderMutation = useCreateSlider();
  const { data: slidersData } = useListSliders({ title: null, status: null });

  useEffect(() => {
    if (open) {
      form.resetFields();
      setImageUrl(null);
      setImageFileName(null);
      setUploading(false);
    }
  }, [open, form]);

  const handleSubmit = async (values: CreateSliderRequest) => {
    const title = values.title?.trim();

    if (!title) {
      message.error("Tiêu đề slider không được để trống");
      return;
    }

    // Kiểm tra trùng tiêu đề slider
    const normalizedNewTitle = title.toLowerCase();
    const existingTitles =
      slidersData?.data
        ?.map((s) => s.title?.trim().toLowerCase())
        .filter(Boolean) ?? [];

    if (existingTitles.includes(normalizedNewTitle)) {
      message.error("Tiêu đề slider đã tồn tại");
      return;
    }

    if (!imageUrl) {
      message.error("Vui lòng upload hình ảnh");
      return;
    }

    try {
      await createSliderMutation.mutateAsync({
        ...values,
        title,
        imageUrl: imageUrl,
      });
      message.success("Tạo slider thành công!");
      form.resetFields();
      setImageUrl(null);
      setImageFileName(null);
      onClose();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.message);
    }
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

  const handleClose = async () => {
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
      title="Tạo slider mới"
      open={open}
      onClose={handleClose}
      width={600}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose}>Hủy</Button>
          <Button type="primary" loading={createSliderMutation.isPending} onClick={() => form.submit()}>
            Tạo slider
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[
            { required: true, message: "Vui lòng nhập tiêu đề" },
            { max: 200, message: "Tiêu đề không được quá 200 ký tự" },
          ]}
        >
          <Input placeholder="Nhập tiêu đề slider" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả" rules={[{ max: 500, message: "Mô tả không được quá 500 ký tự" }]}>
          <Input.TextArea placeholder="Nhập mô tả slider" rows={3} showCount maxLength={500} />
        </Form.Item>

        <Form.Item name="imageUrl" label="Hình ảnh">
          <Space direction="vertical" style={{ width: "100%" }}>
            {imageUrl ? (
              <Space>
                <div className="flex items-center justify-center border border-dashed border-gray-300 p-1">
                  <Image
                    src={imageUrl}
                    alt="Image preview"
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
                      {uploading ? "Đang upload..." : "Chọn ảnh slider"}
                    </Button>
                  </Upload>
                )}
              </>
            )}
            <div style={{ fontSize: "12px", color: "#666" }}>Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP). Kích thước tối đa 100MB.</div>
          </Space>
        </Form.Item>

        <Form.Item name="backLink" label="Liên kết" rules={[{ type: "url", message: "Vui lòng nhập URL hợp lệ" }]}>
          <Input placeholder="https://example.com" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default CreateSliderDrawer;
