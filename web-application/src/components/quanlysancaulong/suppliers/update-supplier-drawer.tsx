"use client";

import { useDetailSupplier, useUpdateSupplier } from "@/hooks/useSuppliers";
import { ApiError } from "@/lib/axios";
import { UpdateSupplierRequest } from "@/types-openapi/api";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, Space, message, Row, Col, FormProps } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useEffect } from "react";

interface UpdateSupplierDrawerProps {
  open: boolean;
  onClose: () => void;
  supplierId: number;
}

const UpdateSupplierDrawer = ({ open, onClose, supplierId }: UpdateSupplierDrawerProps) => {
  const [form] = Form.useForm();

  const { data: detailData, isFetching: loadingDetail, refetch } = useDetailSupplier({ id: supplierId });
  const updateMutation = useUpdateSupplier();

  useEffect(() => {
    if (!detailData?.data || !open) return;
    const d = detailData.data;
    form.setFieldsValue({
      name: d.name ?? null,
      phone: d.phone ?? null,
      email: d.email ?? null,
      address: d.address ?? null,
      city: d.city ?? null,
      district: d.district ?? null,
      ward: d.ward ?? null,
      notes: d.notes ?? null,
    });
  }, [detailData, form, open]);

  useEffect(() => {
    if (open && supplierId) {
      refetch();
    }
  }, [open, supplierId, refetch]);

  const handleSubmit: FormProps<UpdateSupplierRequest>["onFinish"] = (values) => {
    const payload: UpdateSupplierRequest = { ...values, id: supplierId };
    updateMutation.mutate(payload, {
      onSuccess: () => {
        message.success("Cập nhật nhà cung cấp thành công!");
        form.resetFields();
        onClose();
      },
      onError: (error: ApiError) => {
        // Hiển thị message lỗi chính
        message.error(error.message || "Có lỗi xảy ra khi cập nhật nhà cung cấp");

        // Set lỗi vào field tương ứng nếu có
        if (error.message?.toLowerCase().includes("email")) {
          form.setFields([{ name: "email", errors: [error.message] }]);
        } else if (error.message?.toLowerCase().includes("số điện thoại") || error.message?.toLowerCase().includes("phone")) {
          form.setFields([{ name: "phone", errors: [error.message] }]);
        }

        // Xử lý lỗi từ error.errors nếu có
        if (error.errors) {
          for (const key in error.errors) {
            const fieldName = key.toLowerCase();
            if (fieldName === "email" || fieldName === "phone" || fieldName === "name") {
              form.setFields([{ name: fieldName, errors: [error.errors[key]] }]);
            }
          }
        }
      },
    });
  };

  return (
    <Drawer
      title="Cập nhật nhà cung cấp"
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
          <Button onClick={() => form.submit()} type="primary" icon={<SaveOutlined />} loading={updateMutation.isPending} disabled={loadingDetail}>
            Lưu thay đổi
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <FormItem<UpdateSupplierRequest>
              name="name"
              label="Tên nhà cung cấp"
              rules={[{ required: true, message: "Tên nhà cung cấp là bắt buộc" }]}
            >
              <Input placeholder="Nhập tên nhà cung cấp" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<UpdateSupplierRequest>
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: "Số điện thoại là bắt buộc" },
                { pattern: /^[0-9]{10,11}$/, message: "Số điện thoại không hợp lệ" },
              ]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <FormItem<UpdateSupplierRequest>
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Email là bắt buộc" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input placeholder="Nhập email" />
            </FormItem>
          </Col>
        </Row>

        <FormItem<UpdateSupplierRequest> name="address" label="Địa chỉ">
          <Input placeholder="Nhập địa chỉ" />
        </FormItem>

        <Row gutter={16}>
          <Col span={8}>
            <FormItem<UpdateSupplierRequest> name="city" label="Thành phố/Tỉnh">
              <Input placeholder="Nhập thành phố/tỉnh" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<UpdateSupplierRequest> name="district" label="Quận/Huyện">
              <Input placeholder="Nhập quận/huyện" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<UpdateSupplierRequest> name="ward" label="Phường/Xã">
              <Input placeholder="Nhập phường/xã" />
            </FormItem>
          </Col>
        </Row>

        <FormItem<UpdateSupplierRequest> name="notes" label="Ghi chú">
          <Input.TextArea placeholder="Nhập ghi chú" rows={3} />
        </FormItem>
      </Form>
    </Drawer>
  );
};

export default UpdateSupplierDrawer;
