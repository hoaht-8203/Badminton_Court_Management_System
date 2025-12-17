"use client";

import { useDetailSlider, useListSliders, useUpdateSlider } from "@/hooks/useSlider";
import { ApiError } from "@/lib/axios";
import { UpdateSliderRequest } from "@/types-openapi/api";
import { fileService } from "@/services/fileService";
import { Button, Drawer, Form, Input, message, Select, Spin, Upload, Image, Space } from "antd";
import { CloseOutlined, DeleteOutlined, LoadingOutlined, SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

interface UpdateSliderDrawerProps {
  open: boolean;
  onClose: () => void;
  sliderId: string;
}

const UpdateSliderDrawer = ({ open, onClose, sliderId }: UpdateSliderDrawerProps) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch slider detail
  const { data: detailData, isFetching: loadingDetail, refetch } = useDetailSlider({ id: parseInt(sliderId) });
  const { data: slidersData } = useListSliders({ title: null, status: null });

  // Mutation for update
  const updateMutation = useUpdateSlider();

  // Populate form when detail is loaded
  useEffect(() => {
    if (!detailData?.data || !open) return;
    const d = detailData.data;

    form.setFieldsValue({
      title: d.title ?? null,
      description: d.description ?? null,
      backLink: d.backLink ?? null,
      status: d.status ?? null,
    });
    setImageUrl(d.imageUrl);
    setImageFileName(null);
  }, [detailData, form, open]);

  // Refetch detail whenever opening to avoid stale cache
  useEffect(() => {
    if (open && sliderId) {
      refetch();
    }
  }, [open, sliderId, refetch]);

  const handleSubmit = async (values: UpdateSliderRequest) => {
    const title = values.title?.trim();

    if (!title) {
      message.error("Tiêu đề slider không được để trống");
      return;
    }

    // Kiểm tra trùng tiêu đề slider (bỏ qua chính slider đang cập nhật)
    const normalizedNewTitle = title.toLowerCase();
    const existingTitles =
      slidersData?.data
        ?.filter((s) => s.id !== parseInt(sliderId))
        .map((s) => s.title?.trim().toLowerCase())
        .filter(Boolean) ?? [];

    if (existingTitles.includes(normalizedNewTitle)) {
      message.error("Tiêu đề slider đã tồn tại");
      return;
    }
    if (!imageUrl) {
      message.error("Vui lòng upload hình ảnh");
      return;
    }

    const payload: UpdateSliderRequest = {
      ...values,
      id: parseInt(sliderId),
      title,
      imageUrl: imageUrl,
    };

    updateMutation.mutate(payload, {
      onSuccess: () => {
        message.success("Cập nhật slider thành công!");
        form.resetFields();
        setImageUrl(null);
        setImageFileName(null);
        onClose();
      },
      onError: (error: ApiError) => {
        message.error(error.message);
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
      // Only delete if it's a newly uploaded image
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

  return (
    <Drawer
      title="Cập nhật slider"
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
          <Button type="primary" icon={<SaveOutlined />} loading={updateMutation.isPending} disabled={loadingDetail} onClick={() => form.submit()}>
            Lưu thay đổi
          </Button>
        </Space>
      }
    >
      <Spin spinning={loadingDetail}>
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

          <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}>
            <Select
              placeholder="Chọn trạng thái"
              options={[
                { value: "Active", label: "Đang hoạt động" },
                { value: "Inactive", label: "Không hoạt động" },
              ]}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
};

export default UpdateSliderDrawer;
