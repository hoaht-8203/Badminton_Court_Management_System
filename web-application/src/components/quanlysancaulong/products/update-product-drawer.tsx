"use client";

import { useDetailProduct, useUpdateProduct } from "@/hooks/useProducts";
import { ApiError } from "@/lib/axios";
import { UpdateProductRequest } from "@/types-openapi/api";
import { Button, Checkbox, Drawer, Form, Input, InputNumber, Space, Spin, message, Select } from "antd";
import { useEffect } from "react";
import UpdateProductImages from "./update-product-images";

const layout = { labelCol: { span: 7 }, wrapperCol: { span: 17 } } as const;

const UpdateProductDrawer = ({ open, onClose, productId }: { open: boolean; onClose: () => void; productId: number }) => {
  const [form] = Form.useForm<UpdateProductRequest>();
  const { data, isFetching } = useDetailProduct({ id: productId }, open && productId > 0);
  const updateMutation = useUpdateProduct();

  useEffect(() => {
    if (data?.data && open) {
      const { id, images, ...rest } = data.data;
      form.setFieldsValue({ id, ...rest, images: images ?? undefined });
    }
  }, [data?.data, open]);

  const onSubmit = (values: UpdateProductRequest) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        message.success("Cập nhật hàng hóa thành công");
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
          <Form.Item name="code" label="Mã code">
            <Input placeholder="VD: SP001" />
          </Form.Item>
          <Form.Item name="name" label="Tên hàng">
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
            <UpdateProductImages productId={productId} />
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