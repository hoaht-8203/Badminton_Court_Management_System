"use client";

import { useCreateProduct } from "@/hooks/useProducts";
import { ApiError } from "@/lib/axios";
import { productService } from "@/services/productService";
import { CreateProductRequest } from "@/types-openapi/api";
import { Button, Checkbox, Col, Drawer, Form, Input, InputNumber, Row, Space, Upload, UploadFile, UploadProps, message, Select } from "antd";
import { Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useState } from "react";

const CreateNewProductDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form] = Form.useForm<CreateProductRequest>();
  const createMutation = useCreateProduct();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [manageInventory, setManageInventory] = useState(false);

  const uploadProps: UploadProps = {
    beforeUpload: () => false,
    listType: "picture-card",
    fileList: files,
    onChange: ({ fileList }) => setFiles(fileList),
  };

  // Không tạo phiếu kiểm kho ở FE; backend sẽ tự tạo phiếu cân bằng khi phù hợp

  const onSubmit = async (values: CreateProductRequest) => {
    createMutation.mutate(values, {
      onSuccess: async () => {
        try {
          // Get the new product ID
          let productId: number | undefined;

          if (values.code) {
            const list = await productService.list({ code: values.code });
            productId = list.data?.[0]?.id;

            // Upload images if available
            if (files.length > 0 && productId) {
              setUploading(true);
              await productService.updateImages(productId, files.map((f) => f.originFileObj as File).filter(Boolean));
              message.success("Tải ảnh thành công");
            }

            // FE không gọi tạo phiếu kiểm kho ở đây nữa
          } else if (files.length > 0) {
            message.warning("Đã tạo hàng. Vui lòng đặt mã code để tải ảnh ngay lần tới.");
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
    <Drawer title="Thêm hàng hóa" width={720} onClose={onClose} open={open} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={onSubmit} initialValues={{ isDirectSale: true, manageInventory: false }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="code"
              label="Mã code"
              rules={[
                {
                  validator: async (_rule, value) => {
                    if (!value) return Promise.resolve();
                    const res = await productService.list({ code: value });
                    const dup = (res.data || []).some((p) => (p.code || "").toLowerCase() === String(value).toLowerCase());
                    if (dup) return Promise.reject(new Error("Mã hàng đã tồn tại"));
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder="VD: SP001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Tên hàng"
              rules={[
                { required: true, message: "Vui lòng nhập tên hàng" },
                {
                  validator: async (_rule, value) => {
                    if (!value) return Promise.resolve();
                    const res = await productService.list({ name: value });
                    const dup = (res.data || []).some((p) => (p.name || "").toLowerCase() === String(value).toLowerCase());
                    if (dup) return Promise.reject(new Error("Tên hàng đã tồn tại"));
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
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
          </Col>
          <Col span={12}>
            <Form.Item name="category" label="Nhóm hàng">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="position" label="Vị trí">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="unit" label="Đơn vị tính">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="costPrice" label="Giá vốn">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="salePrice" label="Giá bán">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Ảnh sản phẩm">
              <Upload {...uploadProps}>
                <div>Chọn ảnh</div>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="isDirectSale" valuePropName="checked" label="Bán trực tiếp">
              <Checkbox />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="manageInventory" valuePropName="checked" label="Quản lý tồn kho">
              <Checkbox onChange={(e) => setManageInventory(e.target.checked)} />
            </Form.Item>
          </Col>
        </Row>

        {manageInventory && (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="stock"
                label={
                  <span>
                    Tồn kho{" "}
                    <Tooltip title="Số lượng tồn kho của sản phẩm (hệ thống sẽ tự động tạo phiếu kiểm kho )">
                      <InfoCircleOutlined className="cursor-help text-gray-400 hover:text-gray-600" />
                    </Tooltip>
                  </span>
                }
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="minStock"
                label={
                  <span>
                    Ít nhất{" "}
                    <Tooltip title="Tồn ít nhất là tồn tối thiểu của 1 sản phẩm (hệ thống sẽ dựa vào thông tin này để cảnh báo tồn kho tối thiểu)">
                      <InfoCircleOutlined className="cursor-help text-gray-400 hover:text-gray-600" />
                    </Tooltip>
                  </span>
                }
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maxStock"
                label={
                  <span>
                    Nhiều nhất{" "}
                    <Tooltip title="Tồn nhiều nhất là tồn tối đa của 1 sản phẩm (hệ thống sẽ dựa vào thông tin này để cảnh báo khi hàng hóa vượt quá mức tồn cho phép)">
                      <InfoCircleOutlined className="cursor-help text-gray-400 hover:text-gray-600" />
                    </Tooltip>
                  </span>
                }
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="noteTemplate" label="Mẫu ghi chú">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
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
