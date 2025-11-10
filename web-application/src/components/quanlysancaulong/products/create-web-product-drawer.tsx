"use client";

import { useCreateProduct } from "@/hooks/useProducts";
import { useListCategories, useCreateCategory } from "@/hooks/useCategories";
import { ApiError } from "@/lib/axios";
import { productService } from "@/services/productService";
import { CreateProductRequest } from "@/types-openapi/api";
import { Button, Checkbox, Col, Drawer, Form, Input, InputNumber, Row, Space, Upload, UploadFile, UploadProps, message, Select, Divider } from "antd";
import { Tooltip } from "antd";
import { InfoCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

type CreateWebProductDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const CreateWebProductDrawer = ({ open, onClose }: CreateWebProductDrawerProps) => {
  const [form] = Form.useForm<CreateProductRequest>();
  const createMutation = useCreateProduct();
  const createCategoryMutation = useCreateCategory();
  const { data: categoriesData } = useListCategories({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [manageInventory, setManageInventory] = useState(false);
  const qc = useQueryClient();

  const uploadProps: UploadProps = {
    beforeUpload: () => false,
    listType: "picture-card",
    fileList: files,
    onChange: ({ fileList }) => setFiles(fileList),
    multiple: true,
  };

  // Auto-generate code: SP0001 style
  const generateNextCode = async () => {
    try {
      const res = await productService.list({});
      const codes = (res.data || []).map((p) => p.code).filter((c): c is string => !!c && /^SP\d+$/.test(c));
      const maxNum = codes.reduce((acc, c) => {
        const n = parseInt(c.replace(/^SP/, ""), 10);
        return Number.isFinite(n) && n > acc ? n : acc;
      }, 0);
      const next = maxNum + 1;
      const nextCode = `SP${String(next).padStart(4, "0")}`;
      form.setFieldsValue({ code: nextCode });
    } catch {
      // fallback default when list fails
      form.setFieldsValue({ code: "SP0001" });
    }
  };

  useEffect(() => {
    if (open) {
      // Auto set menuType to "Khác" and isDisplayOnWeb to true
      form.setFieldsValue({ menuType: "Khác", isDisplayOnWeb: true });
      // generate code on open
      generateNextCode();
    } else {
      // Reset all states when closing
      setNewCategoryName("");
      setFiles([]);
      setManageInventory(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (values: CreateProductRequest) => {
    // Ensure menuType is "Khác" and isDisplayOnWeb is true
    const finalValues = {
      ...values,
      menuType: "Khác",
      isDisplayOnWeb: true,
    };

    createMutation.mutate(finalValues, {
      onSuccess: async () => {
        try {
          // Get the new product ID
          let productId: number | undefined;

          if (finalValues.code) {
            const list = await productService.list({ code: finalValues.code });
            productId = list.data?.[0]?.id;

            // Upload images if available
            if (files.length > 0 && productId) {
              setUploading(true);
              await productService.updateImages(productId, files.map((f) => f.originFileObj as File).filter(Boolean));
              message.success("Tải ảnh thành công");
              // Ensure detail shows new images and lists refresh
              qc.invalidateQueries({ queryKey: ["product", { id: productId }] });
              qc.invalidateQueries({ queryKey: ["product", productId] });
            }

            // Refresh product lists
            qc.invalidateQueries({ queryKey: ["products"] });
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
    <Drawer title="Thêm sản phẩm bán hàng" width={720} onClose={onClose} open={open} destroyOnClose>
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{
          isDirectSale: true,
          manageInventory: false,
          isDisplayOnWeb: true,
          menuType: "Khác",
          maxStock: 999,
          stock: 0,
          minStock: 0,
          costPrice: 0,
          salePrice: 0,
        }}
      >
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
              <Input placeholder="VD: SP0001" disabled />
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
          <Col span={24}>
            <Form.Item name="categoryId" label="Nhóm hàng" rules={[{ required: true, message: "Vui lòng chọn nhóm hàng" }]}>
              <Select
                placeholder="Chọn nhóm hàng"
                allowClear
                options={categoriesData?.data?.map((category) => ({ value: category.id, label: category.name }))}
                popupRender={(menu) => (
                  <div>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <div style={{ display: "flex", gap: 8, padding: 8 }}>
                      <Input
                        size="small"
                        placeholder="Tên nhóm hàng mới"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onPressEnter={async () => {
                          if (!newCategoryName.trim()) return;
                          try {
                            await createCategoryMutation.mutateAsync({ name: newCategoryName.trim() });
                            message.success("Đã thêm nhóm hàng");
                            setNewCategoryName("");
                          } catch {
                            message.error("Thêm nhóm hàng thất bại");
                          }
                        }}
                      />
                      <Button
                        size="small"
                        type="primary"
                        icon={<PlusOutlined />}
                        loading={createCategoryMutation.isPending}
                        disabled={!newCategoryName.trim()}
                        onClick={async () => {
                          if (!newCategoryName.trim()) return;
                          try {
                            await createCategoryMutation.mutateAsync({ name: newCategoryName.trim() });
                            message.success("Đã thêm nhóm hàng");
                            setNewCategoryName("");
                          } catch {
                            message.error("Thêm nhóm hàng thất bại");
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              />
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
            <Form.Item name="unit" label="Đơn vị tính" rules={[{ required: true, message: "Vui lòng nhập đơn vị tính" }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="costPrice" label="Giá vốn">
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                // @ts-expect-error - Ant Design InputNumber parser type issue
                parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, "")) || 0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="salePrice"
              label="Giá bán"
              rules={[
                { required: true, message: "Vui lòng nhập giá bán" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const cp = Number(getFieldValue("costPrice") || 0);
                    if (value == null || Number(value) >= cp) return Promise.resolve();
                    return Promise.reject(new Error("Giá bán phải lớn hơn hoặc bằng giá vốn"));
                  },
                }),
              ]}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                // @ts-expect-error - Ant Design InputNumber parser type issue
                parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, "")) || 0}
              />
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
          <Col span={12}>
            <Form.Item name="isDirectSale" valuePropName="checked" label="Bán trực tiếp">
              <Checkbox />
            </Form.Item>
          </Col>
          <Col span={12}>
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
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  // @ts-expect-error - Ant Design InputNumber parser type issue
                  parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, "")) || 0}
                />
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
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  // @ts-expect-error - Ant Design InputNumber parser type issue
                  parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, "")) || 0}
                />
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
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  // @ts-expect-error - Ant Design InputNumber parser type issue
                  parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, "")) || 0}
                />
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
              <Input.TextArea rows={3} />
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

export default CreateWebProductDrawer;

