"use client";

import { useDetailBlog, useUpdateBlog } from "@/hooks/useBlogs";
import { UpdateBlogRequest } from "@/types-openapi/api";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { fileService } from "@/services/fileService";
import { DeleteOutlined, LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Col, Drawer, Form, FormProps, Input, message, Row, Select, Space, Upload, Image, Spin } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useEffect, useState } from "react";

interface UpdateBlogDrawerProps {
  open: boolean;
  onClose: () => void;
  blogId: string;
}

const UpdateBlogDrawer = ({ open, onClose, blogId }: UpdateBlogDrawerProps) => {
  const [form] = Form.useForm();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: blogData, isLoading: loadingBlog } = useDetailBlog({ id: blogId });
  const updateBlogMutation = useUpdateBlog();

  useEffect(() => {
    if (blogData?.data) {
      const blog = blogData.data;
      form.setFieldsValue({
        title: blog.title,
        status: blog.status,
      });
      setContent(blog.content ?? "");
      setImageUrl(blog.imageUrl ?? null);
      // Note: We don't have fileName from API, so we can't set imageFileName
      // This means we can't delete the old image when updating
    }
  }, [blogData, form]);

  const handleSubmit: FormProps<UpdateBlogRequest>["onFinish"] = async (values) => {
    if (!content.trim()) {
      message.error("Nội dung blog không được để trống");
      return;
    }

    setLoading(true);
    try {
      await updateBlogMutation.mutateAsync({
        id: blogId,
        title: values.title,
        content: content,
        imageUrl: imageUrl || "",
        status: values.status,
      });

      message.success("Cập nhật blog thành công!");
      onClose();
    } catch (error: any) {
      message.error(error?.message || "Có lỗi xảy ra khi cập nhật blog");
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

  if (loadingBlog) {
    return (
      <Drawer title="Cập nhật blog" placement="right" size="large" open={open} onClose={handleClose}>
        <div className="flex h-64 items-center justify-center">
          <Spin size="large" />
        </div>
      </Drawer>
    );
  }

  return (
    <Drawer
      title="Cập nhật blog"
      placement="right"
      size="large"
      open={open}
      onClose={handleClose}
      extra={
        <Button type="primary" htmlType="submit" form="update-blog-form" loading={loading}>
          Cập nhật blog
        </Button>
      }
      width={1700}
    >
      <Form id="update-blog-form" form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={8}>
            <FormItem<UpdateBlogRequest> label="Tiêu đề blog" name="title" rules={[{ required: true, message: "Vui lòng nhập tiêu đề blog" }]}>
              <Input placeholder="Nhập tiêu đề blog" />
            </FormItem>

            <FormItem<UpdateBlogRequest> label="Hình ảnh" name="imageUrl">
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
            <FormItem<UpdateBlogRequest> label="Nội dung blog" required>
              <SimpleEditor className="!h-[770px] !w-full" content={content} onChange={(content) => setContent(content)} />
            </FormItem>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default UpdateBlogDrawer;
