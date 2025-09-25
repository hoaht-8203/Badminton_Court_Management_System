"use client";

import { useCreateProduct } from "@/hooks/useProducts";
import { ApiError } from "@/lib/axios";
import { productService } from "@/services/productService";
import { CreateProductRequest } from "@/types-openapi/api";
import { Button, Checkbox, Drawer, Form, Input, InputNumber, Space, Upload, UploadFile, UploadProps, message, Select } from "antd";
import { useState } from "react";

const layout = { labelCol: { span: 7 }, wrapperCol: { span: 17 } } as const;

const CreateNewProductDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form] = Form.useForm<CreateProductRequest>();
  const createMutation = useCreateProduct();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadProps: UploadProps = {
    beforeUpload: () => false,
    listType: "picture-card",
    fileList: files,
    onChange: ({ fileList }) => setFiles(fileList),
  };

  const onSubmit = async (values: CreateProductRequest) => {
    createMutation.mutate(values, {
      onSuccess: async () => {
        try {
          // If images selected, attempt to upload using code to resolve id
          if (files.length > 0) {
            if (!values.code) {
              message.warning("Đã tạo hàng. Vui lòng đặt mã code để tải ảnh ngay lần tới.");
            } else {
              setUploading(true);
              const list = await productService.list({ code: values.code });
              const id = list.data?.[0]?.id;
              if (id) {
                await productService.updateImages(
                  id,
                  files.map((f) => f.originFileObj as File).filter(Boolean),
                );
                message.success("Tải ảnh thành công");
              }
            }
          }
        } finally {
          setUploading(false);
          form.resetFields();
          setFiles([]);
          onClose();
        }
      },
      onError: (err: ApiError) => message.error(err.message),
    });
  };

  return (
    <Drawer title="Thêm hàng hóa" width={560} onClose={onClose} open={open} destroyOnClose>
      <Form {...layout} form={form} layout="horizontal" onFinish={onSubmit} initialValues={{ isDirectSale: true, manageInventory: false }}>
        <Form.Item name="code" label="Mã code">
          <Input placeholder="VD: SP001" />
        </Form.Item>
        <Form.Item name="name" label="Tên hàng" rules={[{ required: true, message: "Vui lòng nhập tên hàng" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="menuType" label="Loại thực đơn">
          <Select
            options={[
              { label: "Đồ ăn", value: "Đồ ăn" },
              { label: "Đồ uống", value: "Đồ uống" },
              { label: "Khác", value: "Khác" },
            ]}
            placeholder="Chọn loại thực đơn"
            allowClear
          />
        </Form.Item>
        <Form.Item name="category" label="Nhóm hàng">
          <Input />
        </Form.Item>
        <Form.Item name="position" label="Vị trí">
          <Input />
        </Form.Item>
        <Form.Item name="costPrice" label="Giá vốn">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="salePrice" label="Giá bán">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="isDirectSale" valuePropName="checked" label="Bán trực tiếp">
          <Checkbox />
        </Form.Item>
        <Form.Item name="manageInventory" valuePropName="checked" label="Quản lý tồn kho">
          <Checkbox />
        </Form.Item>
        <Form.Item name="stock" label="Tồn kho">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="minStock" label="Ít nhất">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="maxStock" label="Nhiều nhất">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="noteTemplate" label="Mẫu ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label="Ảnh sản phẩm">
          <Upload {...uploadProps}>
            <div>Chọn ảnh</div>
          </Upload>
        </Form.Item>
        <Form.Item name="unit" label="Đơn vị tính">
          <Input />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 7, span: 17 }}>
          <Space>
            <Button onClick={onClose}>Đóng</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending || uploading}>
              Lưu
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default CreateNewProductDrawer; 