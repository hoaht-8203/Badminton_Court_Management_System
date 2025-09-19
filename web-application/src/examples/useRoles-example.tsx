"use client";

import { useCreateRole, useDeleteRole, useListRoles, useUpdateRole } from "@/hooks/useRoles";
import { ApiError } from "@/lib/axios";
import { CreateRoleRequest, DetailRoleResponse, ListRoleRequest, UpdateRoleRequest } from "@/types-openapi/api";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, message, Modal, Table } from "antd";
import { useState } from "react";

// Example component showing how to use role hooks
const RolesManagementExample = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<DetailRoleResponse | null>(null);
  const [searchParams] = useState<ListRoleRequest>({
    roleName: null,
  });

  // Queries
  const { data: rolesData, isLoading, refetch } = useListRoles(searchParams);
  // const { data: roleDetail } = useDetailRole({
  //   roleId: editingRole?.roleId || "",
  // });

  // Mutations
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();

  const handleCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (role: DetailRoleResponse) => {
    setEditingRole(role);
    form.setFieldsValue(role);
    setIsModalVisible(true);
  };

  const handleDelete = (roleId: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa role này?",
      onOk: () => {
        deleteMutation.mutate(
          { roleId },
          {
            onSuccess: () => {
              message.success("Xóa role thành công!");
              refetch();
            },
            onError: (error: ApiError) => {
              message.error("Có lỗi xảy ra: " + error.message);
            },
          },
        );
      },
    });
  };

  const handleSubmit = (values: CreateRoleRequest) => {
    if (editingRole) {
      // Update role
      const updateData: UpdateRoleRequest = {
        roleId: editingRole.roleId,
        ...values,
      };
      updateMutation.mutate(updateData, {
        onSuccess: () => {
          message.success("Cập nhật role thành công!");
          setIsModalVisible(false);
          refetch();
        },
        onError: (error: ApiError) => {
          message.error("Có lỗi xảy ra: " + error.message);
        },
      });
    } else {
      // Create role
      const createData: CreateRoleRequest = values;
      createMutation.mutate(createData, {
        onSuccess: () => {
          message.success("Tạo role thành công!");
          setIsModalVisible(false);
          refetch();
        },
        onError: (error: ApiError) => {
          message.error("Có lỗi xảy ra: " + error.message);
        },
      });
    }
  };

  const columns = [
    {
      title: "Role Name",
      dataIndex: "roleName",
      key: "roleName",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: DetailRoleResponse) => (
        <div>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.roleId)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Role Management"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Role
          </Button>
        }
      >
        <Table columns={columns} dataSource={rolesData?.data || []} loading={isLoading} rowKey="roleId" />
      </Card>

      <Modal title={editingRole ? "Edit Role" : "Create Role"} open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="roleName" label="Role Name" rules={[{ required: true, message: "Please input role name!" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: "Please input description!" }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingRole ? "Update" : "Create"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RolesManagementExample;
