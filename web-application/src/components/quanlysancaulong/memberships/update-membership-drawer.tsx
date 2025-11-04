"use client";

import { useDetailMembership, useUpdateMembership } from "@/hooks/useMembership";
import { ApiError } from "@/lib/axios";
import { DetailMembershipRequest, UpdateMembershipRequest } from "@/types-openapi/api";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, FormProps, Input, InputNumber, Select, Space, message } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useEffect } from "react";

interface UpdateMembershipDrawerProps {
  open: boolean;
  onClose: () => void;
  id: number | null;
}

const UpdateMembershipDrawer = ({ open, onClose, id }: UpdateMembershipDrawerProps) => {
  const [form] = Form.useForm<UpdateMembershipRequest>();
  const { data: detailData, isFetching: loadingDetail, refetch } = useDetailMembership({ id: id ?? 0 } as DetailMembershipRequest);
  const updateMutation = useUpdateMembership();

  useEffect(() => {
    if (open && id) {
      refetch();
    }
  }, [open, id, refetch]);

  useEffect(() => {
    if (!detailData?.data || !open) return;
    const d = detailData.data;
    form.setFieldsValue({
      id: d.id!,
      name: d.name!,
      price: d.price!,
      discountPercent: d.discountPercent!,
      durationDays: d.durationDays!,
      description: d.description ?? undefined,
      status: d.status ?? undefined,
    });
  }, [detailData, form, open]);

  const handleSubmit: FormProps<UpdateMembershipRequest>["onFinish"] = async (values) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        message.success("Cập nhật gói hội viên thành công!");
        form.resetFields();
        onClose();
      },
      onError: (error: ApiError) => {
        message.error(error.message);
      },
    });
  };

  return (
    <Drawer
      title="Cập nhật gói hội viên"
      closable={{ "aria-label": "Close Button" }}
      onClose={() => {
        form.resetFields();
        onClose();
      }}
      open={open}
      width={560}
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
          <Button type="primary" icon={<SaveOutlined />} loading={updateMutation.isPending || loadingDetail} onClick={() => form.submit()}>
            Lưu thay đổi
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <FormItem<UpdateMembershipRequest> name="id" hidden>
          <Input />
        </FormItem>
        <FormItem<UpdateMembershipRequest> name="name" label="Tên gói" rules={[{ required: true, message: "Tên gói là bắt buộc" }]}>
          <Input placeholder="Nhập tên gói" />
        </FormItem>
        <FormItem<UpdateMembershipRequest> name="price" label="Giá" rules={[{ required: true, message: "Giá là bắt buộc" }]}>
          <InputNumber min={0} style={{ width: "100%" }} placeholder="Nhập giá" />
        </FormItem>
        <FormItem<UpdateMembershipRequest>
          name="discountPercent"
          label="% giảm giá khi đặt sân"
          rules={[{ required: true, message: "% giảm giá là bắt buộc" }]}
        >
          <InputNumber min={0} max={100} style={{ width: "100%" }} placeholder="Nhập % giảm" />
        </FormItem>
        <FormItem<UpdateMembershipRequest> name="durationDays" label="Thời hạn (ngày)" rules={[{ required: true, message: "Thời hạn là bắt buộc" }]}>
          <InputNumber min={1} style={{ width: "100%" }} placeholder="Nhập số ngày" />
        </FormItem>
        <FormItem<UpdateMembershipRequest> name="description" label="Mô tả quyền lợi">
          <Input.TextArea rows={3} placeholder="Nhập mô tả" />
        </FormItem>
        <FormItem<UpdateMembershipRequest> name="status" label="Trạng thái">
          <Select
            allowClear
            options={[
              { value: "Active", label: "Hoạt động" },
              { value: "Inactive", label: "Không hoạt động" },
            ]}
          />
        </FormItem>
      </Form>
    </Drawer>
  );
};

export default UpdateMembershipDrawer;
