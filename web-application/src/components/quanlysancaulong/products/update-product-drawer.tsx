"use client";

import { useDetailProduct, useUpdateProduct } from "@/hooks/useProducts";
import { ApiError } from "@/lib/axios";
import { UpdateProductRequest } from "@/types-openapi/api";
import { Button, Checkbox, Drawer, Form, Input, InputNumber, Space, Spin, message, Select } from "antd";
import { Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import UpdateProductImages from "./update-product-images";

const layout = { labelCol: { span: 7 }, wrapperCol: { span: 17 } } as const;

const UpdateProductDrawer = ({ open, onClose, productId }: { open: boolean; onClose: () => void; productId: number }) => {
  const [form] = Form.useForm<UpdateProductRequest>();
  const { data, isFetching } = useDetailProduct({ id: productId }, open && productId > 0);
  const updateMutation = useUpdateProduct();
  const [manageInventory, setManageInventory] = useState(false);

  useEffect(() => {
    if (data?.data && open) {
      const { id, images, ...rest } = data.data;
      form.setFieldsValue({ id, ...rest, images: images ?? undefined });
      setManageInventory(!!rest.manageInventory);
    }
  }, [data?.data, open, form]);

  // Import inventory hooks at the top of the file
  const createInventoryCheck = async (productCode: string, productName: string, productId: number, stock: number, previousStock: number) => {
    try {
      const inventoryService = (await import("@/services/inventoryService")).inventoryService;
      const productService = (await import("@/services/productService")).productService;

      // Get product ID if needed
      let prodId = productId;
      if (!prodId) {
        const products = await productService.list({ code: productCode });
        if (products.data && products.data.length > 0) {
          prodId = products.data[0].id!;
        }
      }

      if (!prodId) {
        console.error("Could not find product ID");
        return;
      }

      // Create inventory check
      const now = new Date();
      const checkData = {
        code: `KK${now.getTime().toString().substring(5)}`,
        checkTime: now,
        note: `Phiếu kiểm kho được tạo tự động khi cập nhật Hàng hóa:${productName}`,
        status: 1, // Đã cân bằng kho
        items: [
          {
            productId: prodId,
            productCode: productCode,
            productName: productName,
            systemQuantity: previousStock || 0,
            actualQuantity: stock || 0,
            // deltaQuantity will be calculated on the server side
          },
        ],
      };

      await inventoryService.create(checkData);
      message.success("Đã tạo phiếu kiểm kho tự động");
    } catch (error) {
      console.error("Failed to create inventory check:", error);
      message.warning("Cập nhật hàng hóa thành công nhưng không thể tạo phiếu kiểm kho tự động");
    }
  };

  const onSubmit = (values: UpdateProductRequest) => {
    const previousStock = data?.data?.stock || 0;
    const newStock = values.stock || 0;
    const stockChanged = values.manageInventory && previousStock !== newStock;

    updateMutation.mutate(values, {
      onSuccess: async () => {
        message.success("Cập nhật hàng hóa thành công");

        // Create inventory check if stock changed
        if (stockChanged && values.code && values.name) {
          await createInventoryCheck(values.code, values.name, values.id!, newStock, previousStock);
        }

        onClose();
      },
      onError: (err: ApiError) => message.error(err.message),
    });
  };

  return (
    <Drawer title="Cập nhật hàng hóa" width={560} onClose={onClose} open={open} destroyOnClose>
      <Spin spinning={isFetching}>
        <Form {...layout} form={form} layout="horizontal" onFinish={onSubmit}>
          <Form.Item name="id" hidden>
            <InputNumber />
          </Form.Item>
          <Form.Item
            name="code"
            label="Mã code"
            rules={[
              {
                validator: async (_rule, value) => {
                  if (!value) return Promise.resolve();
                  const res = await (await import("@/services/productService")).productService.list({ code: value });
                  const dup = (res.data || []).some((p: any) => (p.code || "").toLowerCase() === String(value).toLowerCase() && p.id !== productId);
                  if (dup) return Promise.reject(new Error("Mã hàng đã tồn tại"));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="VD: SP001" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên hàng"
            rules={[
              {
                validator: async (_rule, value) => {
                  if (!value) return Promise.resolve();
                  const res = await (await import("@/services/productService")).productService.list({ name: value });
                  const dup = (res.data || []).some((p: any) => (p.name || "").toLowerCase() === String(value).toLowerCase() && p.id !== productId);
                  if (dup) return Promise.reject(new Error("Tên hàng đã tồn tại"));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input />
          </Form.Item>
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
          <Form.Item label="Ảnh sản phẩm">
            <UpdateProductImages productId={productId} />
          </Form.Item>
          <Form.Item name="isDirectSale" valuePropName="checked" label="Bán trực tiếp">
            <Checkbox />
          </Form.Item>
          <Form.Item name="manageInventory" valuePropName="checked" label="Quản lý tồn kho">
            <Checkbox onChange={(e) => setManageInventory(e.target.checked)} />
          </Form.Item>
          {manageInventory && (
            <>
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
            </>
          )}
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="noteTemplate" label="Mẫu ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị tính">
            <Input />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 7, span: 17 }}>
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
