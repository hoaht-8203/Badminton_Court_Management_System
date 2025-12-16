"use client";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { useCreateBlog, useListBlogs } from "@/hooks/useBlogs";
import { fileService } from "@/services/fileService";
import { CreateBlogRequest } from "@/types-openapi/api";
import { DeleteOutlined, LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Col, Drawer, Form, FormProps, Image, Input, message, Row, Space, Spin, Upload } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useState } from "react";

interface CreateBlogDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateBlogDrawer = ({ open, onClose }: CreateBlogDrawerProps) => {
  const [form] = Form.useForm();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const createBlogMutation = useCreateBlog();
  const { data: blogsData } = useListBlogs({ title: null, status: null });

  const handleSubmit: FormProps<CreateBlogRequest>["onFinish"] = async (values) => {
    const title = values.title?.trim();

    if (!title) {
      message.error("Tiêu đề blog không được để trống");
      return;
    }

    const normalizedNewTitle = title.toLowerCase();
    const existingTitles =
      blogsData?.data
        ?.map((b) => b.title?.trim().toLowerCase())
        .filter(Boolean) ?? [];

    if (existingTitles.includes(normalizedNewTitle)) {
      message.error("Tiêu đề blog đã tồn tại");
      return;
    }

    const plainTextContent = content
      ?.replace(/<[^>]*>/g, " ") // loại bỏ thẻ HTML
      .replace(/&nbsp;/g, " ") // thay &nbsp; bằng khoảng trắng
      .trim();

    if (!plainTextContent) {
      message.error("Nội dung blog không được để trống");
      return;
    }

    if (!imageUrl) {
      message.error("Hình ảnh blog không được để trống");
      return;
    }

    setLoading(true);
    try {
      await createBlogMutation.mutateAsync({
        title: title,
        content: content,
        imageUrl: imageUrl,
      });

      message.success("Tạo blog thành công!");
      form.resetFields();
      setContent("");
      setImageUrl(null);
      setImageFileName(null);
      onClose();
    } catch (error: any) {
      message.error(error?.message || "Có lỗi xảy ra khi tạo blog");
    } finally {
      setLoading(false);
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
      setContent("");
      setImageUrl(null);
      setImageFileName(null);
      setUploading(false);
      onClose();
    }
  };

  return (
    <Drawer
      forceRender
      title="Tạo blog mới"
      placement="right"
      size="large"
      open={open}
      onClose={handleClose}
      extra={
        <Button type="primary" loading={loading} onClick={() => form.submit()}>
          Tạo blog
        </Button>
      }
      width={1700}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: "Active",
        }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <FormItem<CreateBlogRequest> label="Tiêu đề blog" name="title" rules={[{ required: true, message: "Vui lòng nhập tiêu đề blog" }]}>
              <Input placeholder="Nhập tiêu đề blog" />
            </FormItem>

            <FormItem<CreateBlogRequest> label="Hình ảnh" name="imageUrl">
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
                          {uploading ? "Đang upload..." : "Chọn ảnh blog"}
                        </Button>
                      </Upload>
                    )}
                  </>
                )}
                <div style={{ fontSize: "12px", color: "#666" }}>Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP). Kích thước tối đa 100MB.</div>
              </Space>
            </FormItem>
          </Col>

          <Col span={16}>
            <FormItem<CreateBlogRequest> label="Nội dung blog" required>
              <SimpleEditor className="!h-[770px] !w-full" content={content} onChange={(content) => setContent(content)} />
            </FormItem>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default CreateBlogDrawer;
