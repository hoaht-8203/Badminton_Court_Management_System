"use client";

import React, { useState } from "react";
import { Button, Card, Form, Input, Modal, Table, message, Space, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { ListCategoryResponse } from "@/types-openapi/api";
import type { TableColumnsType } from "antd";

const CategoryManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ListCategoryResponse | null>(null);

  const { data: categoriesData, isFetching } = useListCategories({});
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const handleCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        messageApi.success("Xóa nhóm hàng thành công!");
      },
      onError: () => {
        messageApi.error("Xóa nhóm hàng thất bại!");
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id!, name: values.name });
        messageApi.success("Cập nhật nhóm hàng thành công!");
      } else {
        await createMutation.mutateAsync({ name: values.name });
        messageApi.success("Tạo nhóm hàng thành công!");
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch {
      messageApi.error(editingCategory ? "Cập nhật nhóm hàng thất bại!" : "Tạo nhóm hàng thất bại!");
    }
  };

  const columns: TableColumnsType<ListCategoryResponse> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Tên nhóm hàng",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa nhóm hàng này?"
            onConfirm={() => handleDelete(record.id!)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Card
        title="Quản lý nhóm hàng"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Thêm nhóm hàng
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={categoriesData?.data || []}
          loading={isFetching}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={editingCategory ? "Chỉnh sửa nhóm hàng" : "Thêm nhóm hàng mới"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Tên nhóm hàng"
            rules={[
              { required: true, message: "Vui lòng nhập tên nhóm hàng!" },
              { max: 100, message: "Tên nhóm hàng không được quá 100 ký tự!" }
            ]}
          >
            <Input placeholder="Nhập tên nhóm hàng" />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingCategory ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CategoryManagement;
