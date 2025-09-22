"use client";

import { columns } from "@/components/quanlysancaulong/users/column";
import CreateNewUserDrawer from "@/components/quanlysancaulong/users/create-new-user-drawer";
import SearchUser from "@/components/quanlysancaulong/users/search-users";
import UpdateUserDrawer from "@/components/quanlysancaulong/users/update-user-drawer";
import { useChangeUserStatus, useListAdministrators, useListUserRoles, useUpdateUserRoles } from "@/hooks/useUsers";
import { ApiError } from "@/lib/axios";
import { ListAdministratorRequest, ListAdministratorResponse, ListUserRoleItemResponse } from "@/types-openapi/api";
import { ApplicationUserStatus } from "@/types/commons";
import { CheckOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SaveOutlined, StopOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Checkbox, CheckboxChangeEvent, Col, Divider, List, message, Modal, Row, Table, TableProps, Tabs } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

const tableProps: TableProps<ListAdministratorResponse> = {
  rowKey: "userId",
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

const UsersPage = () => {
  const [searchParams, setSearchParams] = useState<ListAdministratorRequest>({
    keyword: null,
    role: null,
    status: null,
  });
  const [openCreateNewUserDrawer, setOpenCreateNewUserDrawer] = useState(false);
  const [openUpdateUserDrawer, setOpenUpdateUserDrawer] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [modal, contextHolder] = Modal.useModal();

  const { data: usersData, isFetching: loadingUsersData, refetch: refetchUsersData } = useListAdministrators(searchParams);
  const { data: userRolesData, isFetching: loadingUserRolesData, refetch: refetchUserRolesData } = useListUserRoles({ userId: selectedUserId ?? "" });

  const changeUserStatusMutation = useChangeUserStatus();
  const handleClickUpdateUser = (record: ListAdministratorResponse) => {
    setOpenUpdateUserDrawer(true);
    setUserId(record.userId ?? "");
  };

  const handleClickChangeUserStatus = (status: string, record: ListAdministratorResponse) => {
    if (status === ApplicationUserStatus.Inactive) {
      modal.confirm({
        title: "Xác nhận",
        content: (
          <div>
            <p>Bạn có chắc chắn muốn ngừng hoạt động người dùng này?</p>
            <p>
              Lưu ý: Người dùng này sẽ <span className="font-bold text-red-500">không thể đăng nhập</span> vào hệ thống sau khi ngừng hoạt động.
            </p>
          </div>
        ),
        onOk: () => {
          changeUserStatusMutation.mutate(
            {
              userId: record.userId ?? "",
              status: status,
            },
            {
              onSuccess: () => {
                message.success("Cập nhật trạng thái người dùng thành công!");
              },
              onError: (error: ApiError) => {
                for (const key in error.errors) {
                  message.error(error.errors[key]);
                }
              },
            },
          );
        },
        okText: "Xác nhận",
        cancelText: "Hủy",
      });
    }

    if (status === ApplicationUserStatus.Active) {
      modal.confirm({
        title: "Xác nhận",
        content: "Bạn có chắc chắn muốn kích hoạt người dùng này?",
        onOk: () => {
          changeUserStatusMutation.mutate(
            {
              userId: record.userId ?? "",
              status: status,
            },
            {
              onSuccess: () => {
                message.success("Cập nhật trạng thái người dùng thành công!");
              },
              onError: (error: ApiError) => {
                for (const key in error.errors) {
                  message.error(error.errors[key]);
                }
              },
            },
          );
        },
        okText: "Xác nhận",
        cancelText: "Hủy",
      });
    }
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
              title: "Quản lý người dùng",
            },
          ]}
        />
      </div>

      <div className="mb-2">
        <SearchUser onSearch={setSearchParams} onReset={() => setSearchParams({ keyword: null, role: null, status: null })} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số người dùng: {usersData?.data?.length ?? 0}</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreateNewUserDrawer(true)}>
              Thêm người dùng
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetchUsersData()}>
              Tải lại
            </Button>
          </div>
        </div>

        <Table<ListAdministratorResponse>
          {...tableProps}
          columns={columns}
          dataSource={usersData?.data ?? []}
          loading={loadingUsersData}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => (
              <div>
                <Tabs
                  defaultActiveKey="1"
                  items={[
                    {
                      key: "1",
                      label: "Thông tin người dùng",
                      children: (
                        <UserInformation
                          record={record}
                          handleClickUpdateUser={() => handleClickUpdateUser(record)}
                          handleClickChangeUserStatus={(status) => {
                            handleClickChangeUserStatus(status, record);
                          }}
                        />
                      ),
                    },
                    {
                      key: "2",
                      label: "Quản lý vai trò người dùng",
                      children: (
                        <UserRoleManagement
                          record={record}
                          listUserRoles={userRolesData?.data ?? []}
                          refetchUserRolesData={refetchUserRolesData}
                          loadingUserRolesData={loadingUserRolesData}
                        />
                      ),
                    },
                  ]}
                />
              </div>
            ),
            onExpand: (expanded, record) => {
              if (expanded && record.userId) {
                setSelectedUserId(record.userId);
              }
            },
          }}
        />
      </div>

      <CreateNewUserDrawer open={openCreateNewUserDrawer} onClose={() => setOpenCreateNewUserDrawer(false)} />

      <UpdateUserDrawer open={openUpdateUserDrawer} onClose={() => setOpenUpdateUserDrawer(false)} userId={userId ?? ""} />

      {contextHolder}
    </section>
  );
};

const UserInformation = ({
  record,
  handleClickUpdateUser,
  handleClickChangeUserStatus,
}: {
  record: ListAdministratorResponse;
  handleClickUpdateUser: () => void;
  handleClickChangeUserStatus: (payload: string) => void;
}) => {
  return (
    <div>
      <Row gutter={16} className="mb-4">
        <Col span={4}>
          <Row gutter={16}>
            <Col span={12}>Tên đăng nhập:</Col>
            <Col span={12}>{record.userName}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={12}>Tên người dùng:</Col>
            <Col span={12}>{record.fullName}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={12}>Email:</Col>
            <Col span={12}>{record.email}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={12}>Số điện thoại:</Col>
            <Col span={12}>{record.phoneNumber}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
          </Row>
        </Col>

        <Divider type="vertical" size="small" style={{ height: "auto" }} />

        <Col span={4}>
          <Row gutter={16}>
            <Col span={12}>Trạng thái:</Col>
            <Col span={12}>{record.status}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={12}>Địa chỉ:</Col>
            <Col span={12}>{record.address}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={12}>Thành phố:</Col>
            <Col span={12}>{record.city}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={12}>Quận:</Col>
            <Col span={12}>{record.district}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={12}>Phường:</Col>
            <Col span={12}>{record.ward}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={12}>Ngày sinh:</Col>
            <Col span={12}>{record.dateOfBirth ? dayjs(record.dateOfBirth).format("DD/MM/YYYY") : "-"}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
          </Row>
        </Col>

        <Col span={6}>
          <Row gutter={16}>
            <Col span={5}>Ghi chú:</Col>
            <Col span={19}>{record.note}</Col>
          </Row>
        </Col>
      </Row>

      <div className="flex gap-2">
        {record.status === ApplicationUserStatus.Active && (
          <Button
            color="danger"
            variant="outlined"
            icon={<StopOutlined />}
            onClick={() => handleClickChangeUserStatus(ApplicationUserStatus.Inactive)}
          >
            Ngừng hoạt động
          </Button>
        )}

        {record.status === ApplicationUserStatus.Inactive && (
          <Button color="green" variant="outlined" icon={<CheckOutlined />} onClick={() => handleClickChangeUserStatus(ApplicationUserStatus.Active)}>
            Kích hoạt
          </Button>
        )}
        <Button type="primary" icon={<EditOutlined />} onClick={handleClickUpdateUser}>
          Cập nhật thông tin
        </Button>
      </div>
    </div>
  );
};

const UserRoleManagement = ({
  record,
  listUserRoles,
  loadingUserRolesData,
  refetchUserRolesData,
}: {
  record: ListAdministratorResponse;
  listUserRoles: ListUserRoleItemResponse[];
  loadingUserRolesData: boolean;
  refetchUserRolesData: () => void;
}) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const updateUserRolesMutation = useUpdateUserRoles();

  useEffect(() => {
    setSelectedRoles(listUserRoles?.filter((item) => item.assigned).map((item) => item.roleId) ?? []);
  }, [listUserRoles]);

  const handleChangeUserRole = (e: CheckboxChangeEvent, roleId: string) => {
    if (e.target.checked) {
      setSelectedRoles([...selectedRoles, roleId]);
    } else {
      setSelectedRoles(selectedRoles.filter((id) => id !== roleId));
    }
  };

  const handleSaveUserRoles = () => {
    updateUserRolesMutation.mutate(
      {
        userId: record.userId ?? "",
        roles: listUserRoles.filter((item) => selectedRoles.includes(item.roleId)).map((item) => item.roleName ?? ""),
      },
      {
        onSuccess: () => {
          message.success("Cập nhật vai trò người dùng thành công!");
        },
        onError: (error: ApiError) => {
          message.error(error.message);
        },
      },
    );
  };

  return (
    <>
      <Row gutter={16}>
        <Col span={4}>
          <List
            size="small"
            bordered
            dataSource={listUserRoles ?? []}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Checkbox key={item.roleId} checked={selectedRoles.includes(item.roleId)} onChange={(e) => handleChangeUserRole(e, item.roleId)} />,
                ]}
              >
                {item.roleName}
              </List.Item>
            )}
            loading={loadingUserRolesData}
            rowKey="roleId"
          />
        </Col>
        <Col span={20}>
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => {
                refetchUserRolesData();
                setSelectedRoles(listUserRoles?.filter((item) => item.assigned).map((item) => item.roleId) ?? []);
              }}
            >
              Tải lại
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveUserRoles}>
              Xác nhận
            </Button>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default UsersPage;
