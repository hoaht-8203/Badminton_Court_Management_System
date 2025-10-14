"use client";

import { useDetailProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useListCategories, useCreateCategory } from "@/hooks/useCategories";
import { ApiError } from "@/lib/axios";
import { UpdateProductRequest } from "@/types-openapi/api";
import { Button, Checkbox, Drawer, Form, Input, InputNumber, Space, Spin, message, Select, Row, Col, Divider } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import UpdateProductImages from "./update-product-images";

const UpdateProductDrawer = ({ open, onClose, productId }: { open: boolean; onClose: () => void; productId: number }) => {
  const [form] = Form.useForm<UpdateProductRequest>();
  const { data, isFetching } = useDetailProduct({ id: productId }, open && productId > 0);
  const { data: categoriesData } = useListCategories({});
  const createCategoryMutation = useCreateCategory();
  const [newCategoryName, setNewCategoryName] = useState("");
  const updateMutation = useUpdateProduct();
  const [manageInventory, setManageInventory] = useState(false);

  useEffect(() => {
    if (data?.data && open) {
      const { id, images, ...rest } = data.data;
      form.setFieldsValue({ id, ...rest, images: images ?? undefined });
      setManageInventory(!!rest.manageInventory);
    }
  }, [data?.data, open, form]);

  // FE no longer creates inventory checks here; backend handles auto-balanced creation when stock changes.

  const onSubmit = (values: UpdateProductRequest) => {
    // Ensure not to accidentally change active status; backend has a dedicated endpoint
    const { isActive, ...rest } = values as any;
    updateMutation.mutate(rest as UpdateProductRequest, {
      onSuccess: async () => {
        message.success("Cập nhật hàng hóa thành công");
        onClose();
      },
      onError: (err: ApiError) => message.error(err.message),
    });
  };

  return (
    <Drawer title="Cập nhật hàng hóa" width={720} onClose={onClose} open={open} destroyOnClose>
      <Spin spinning={isFetching}>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="id" hidden>
            <InputNumber />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã code"
                rules={[
                  {
                    validator: async (_rule, value) => {
                      if (!value) return Promise.resolve();
                      const res = await (await import("@/services/productService")).productService.list({ code: value });
                      const dup = (res.data || []).some(
                        (p: any) => (p.code || "").toLowerCase() === String(value).toLowerCase() && p.id !== productId,
                      );
                      if (dup) return Promise.reject(new Error("Mã hàng đã tồn tại"));
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="VD: SP001" disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên hàng"
                rules={[
                  {
                    validator: async (_rule, value) => {
                      if (!value) return Promise.resolve();
                      const res = await (await import("@/services/productService")).productService.list({ name: value });
                      const dup = (res.data || []).some(
                        (p: any) => (p.name || "").toLowerCase() === String(value).toLowerCase() && p.id !== productId,
                      );
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
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="categoryId" label="Nhóm hàng">
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
              <Form.Item
                name="salePrice"
                label="Giá bán"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const cp = Number(getFieldValue("costPrice") || 0);
                      if (value == null || Number(value) >= cp) return Promise.resolve();
                      return Promise.reject(new Error("Giá bán phải lớn hơn hoặc bằng giá vốn"));
                    },
                  }),
                ]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Ảnh sản phẩm">
                <UpdateProductImages productId={productId} />
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
                      <Tooltip title="Số lượng tồn kho của sản phẩm (hệ thống sẽ tự động tạo phiếu kiểm kho giống như phần mềm Kiot Việt)">
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
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                Lưu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
};

export default UpdateProductDrawer;
