"use client";

import { useDetailRole, useUpdateRole } from "@/hooks/useRoles";
import { ApiError } from "@/lib/axios";
import { UpdateRoleRequest } from "@/types-openapi/api";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, Space, message } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useEffect } from "react";

interface UpdateRoleDrawerProps {
  open: boolean;
  onClose: () => void;
  roleId: string;
}

const UpdateRoleDrawer = ({ open, onClose, roleId }: UpdateRoleDrawerProps) => {
  const [form] = Form.useForm();

  // Fetch role detail
  const { data: detailData, isFetching: loadingDetail, refetch } = useDetailRole({ roleId });

  // Mutation for update
  const updateMutation = useUpdateRole();

  // Populate form when detail is loaded
  useEffect(() => {
    if (!detailData?.data || !open) return;
    const d = detailData.data;

    form.setFieldsValue({
      roleName: d.roleName ?? null,
    });
  }, [detailData, form, open]);

  // Refetch detail whenever opening to avoid stale cache
  useEffect(() => {
    if (open && roleId) {
      refetch();
    }
  }, [open, roleId, refetch]);

  const handleSubmit = async () => {
    const values = await form.validateFields();

    const payload: UpdateRoleRequest = {
      roleId,
      roleName: values.roleName ?? null,
    };

    updateMutation.mutate(payload, {
      onSuccess: () => {
        message.success("Cập nhật vai trò thành công!");
        form.resetFields();
        onClose();
      },
      onError: (error: ApiError) => {
        for (const key in error.errors) {
          message.error(error.errors[key]);
          form.setFields([{ name: key, errors: [error.errors[key]] }]);
        }
      },
    });
  };

  return (
    <Drawer
      title="Cập nhật vai trò"
      closable={{ "aria-label": "Close Button" }}
      onClose={() => {
        form.resetFields();
        onClose();
      }}
      open={open}
      width={500}
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
          <Button onClick={handleSubmit} type="primary" icon={<SaveOutlined />} loading={updateMutation.isPending} disabled={loadingDetail}>
            Lưu thay đổi
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <FormItem<UpdateRoleRequest>
          name="roleName"
          label="Tên vai trò"
          rules={[
            { required: true, message: "Tên vai trò là bắt buộc" },
            { min: 2, message: "Tên vai trò phải có ít nhất 2 ký tự" },
            { max: 50, message: "Tên vai trò không được quá 50 ký tự" },
          ]}
        >
          <Input placeholder="Nhập tên vai trò" />
        </FormItem>
      </Form>
    </Drawer>
  );
};

export default UpdateRoleDrawer;
