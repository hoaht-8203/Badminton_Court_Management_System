"use client";

import CreateNewRoleDrawer from "@/components/quanlysancaulong/roles/create-new-role-drawer";
import { columns } from "@/components/quanlysancaulong/roles/roles-columns";
import SearchRoles from "@/components/quanlysancaulong/roles/search-roles";
import UpdateRoleDrawer from "@/components/quanlysancaulong/roles/update-role-drawer";
import { useDeleteRole, useListRoles } from "@/hooks/useRoles";
import { ApiError } from "@/lib/axios";
import { ListRoleRequest, ListRoleResponse } from "@/types-openapi/api";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Col, Divider, message, Modal, Row, Table, TableProps } from "antd";
import { useState } from "react";

const tableProps: TableProps<ListRoleResponse> = {
  rowKey: "roleId",
  size: "small",
  scroll: { x: "max-content" },
  expandable: {
    expandRowByClick: true,
  },
  onRow: () => ({
    style: {
      cursor: "pointer",
    },
  }),
  bordered: true,
};

const RolesPage = () => {
  const [searchParams, setSearchParams] = useState<ListRoleRequest>({
    roleName: null,
  });
  const [openCreateNewRoleDrawer, setOpenCreateNewRoleDrawer] = useState(false);
  const [openUpdateRoleDrawer, setOpenUpdateRoleDrawer] = useState(false);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [modal, contextHolder] = Modal.useModal();

  const { data: rolesData, isFetching: loadingRolesData, refetch: refetchRolesData } = useListRoles(searchParams);

  const deleteRoleMutation = useDeleteRole();

  const handleClickUpdateRole = (record: ListRoleResponse) => {
    setOpenUpdateRoleDrawer(true);
    setRoleId(record.roleId ?? "");
  };

  const handleClickDeleteRole = (record: ListRoleResponse) => {
    modal.confirm({
      title: "Xác nhận",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa vai trò này?</p>
          <p>
            Lưu ý: Vai trò <span className="font-bold text-red-500">{record.roleName}</span> sẽ bị xóa vĩnh viễn và không thể khôi phục.
          </p>
        </div>
      ),
      onOk: () => {
        deleteRoleMutation.mutate(
          {
            roleId: record.roleId ?? "",
          },
          {
            onSuccess: () => {
              message.success("Xóa vai trò thành công!");
            },
            onError: (error: ApiError) => {
              message.error(error.message);
            },
          },
        );
      },
      okText: "Xác nhận",
      cancelText: "Hủy",
    });
  };

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb
          items={[
            {
              title: "Quản trị ứng dụng",
            },
            {
              title: "Quản lý vai trò",
            },
          ]}
        />
      </div>

      <div className="mb-2">
        <SearchRoles onSearch={setSearchParams} onReset={() => setSearchParams({ roleName: null })} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số vai trò: {rolesData?.data?.length ?? 0}</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreateNewRoleDrawer(true)}>
              Thêm vai trò
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetchRolesData()}>
              Tải lại
            </Button>
          </div>
        </div>

        <Table<ListRoleResponse>
          {...tableProps}
          columns={columns}
          dataSource={rolesData?.data ?? []}
          loading={loadingRolesData}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => (
              <div>
                <RoleInformation
                  record={record}
                  handleClickUpdateRole={() => handleClickUpdateRole(record)}
                  handleClickDeleteRole={() => handleClickDeleteRole(record)}
                />
              </div>
            ),
          }}
        />
      </div>

      <CreateNewRoleDrawer open={openCreateNewRoleDrawer} onClose={() => setOpenCreateNewRoleDrawer(false)} />

      <UpdateRoleDrawer open={openUpdateRoleDrawer} onClose={() => setOpenUpdateRoleDrawer(false)} roleId={roleId ?? ""} />

      {contextHolder}
    </section>
  );
};

const RoleInformation = ({
  record,
  handleClickUpdateRole,
  handleClickDeleteRole,
}: {
  record: ListRoleResponse;
  handleClickUpdateRole: () => void;
  handleClickDeleteRole: () => void;
}) => {
  return (
    <div>
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Row gutter={16}>
            <Col span={8}>ID Vai trò:</Col>
            <Col span={16}>{record.roleId}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={8}>Tên vai trò:</Col>
            <Col span={16}>{record.roleName}</Col>
          </Row>
        </Col>
      </Row>

      <div className="flex gap-2">
        <Button type="primary" icon={<EditOutlined />} onClick={handleClickUpdateRole}>
          Cập nhật vai trò
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleClickDeleteRole}>
          Xóa vai trò
        </Button>
      </div>
    </div>
  );
};

export default RolesPage;
