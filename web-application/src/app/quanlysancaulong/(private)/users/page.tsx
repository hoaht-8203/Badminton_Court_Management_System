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
import {
  Breadcrumb,
  Button,
  Checkbox,
  CheckboxChangeEvent,
  Col,
  Descriptions,
  Divider,
  List,
  message,
  Modal,
  Row,
  Table,
  TableProps,
  Tabs,
  Tag,
  Card,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { getRoleLabel } from "@/constants/roleLabels";

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
  const getStatusTag = (status: string | undefined | null) => {
    if (status === ApplicationUserStatus.Active) {
      return <Tag color="success">Hoạt động</Tag>;
    }
    return <Tag color="error">Ngừng hoạt động</Tag>;
  };

  return (
    <div>
      <Card variant="borderless" className="mb-4">
        <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }} size="middle">
          <Descriptions.Item label="Tên đăng nhập">
            <span className="font-medium">{record.userName || "-"}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Tên người dùng">
            <span className="font-medium">{record.fullName || "-"}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">{getStatusTag(record.status)}</Descriptions.Item>
          <Descriptions.Item label="Email">{record.email || "-"}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{record.phoneNumber || "-"}</Descriptions.Item>
          <Descriptions.Item label="Ngày sinh">{record.dateOfBirth ? dayjs(record.dateOfBirth).format("DD/MM/YYYY") : "-"}</Descriptions.Item>
          <Descriptions.Item label="Địa chỉ" span={3}>
            {record.address || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Phường">{record.ward || "-"}</Descriptions.Item>
          <Descriptions.Item label="Quận">{record.district || "-"}</Descriptions.Item>
          <Descriptions.Item label="Thành phố">{record.city || "-"}</Descriptions.Item>
          {record.note && (
            <Descriptions.Item label="Ghi chú" span={3}>
              <div className="whitespace-pre-wrap">{record.note}</div>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <div className="mt-2 flex gap-2">
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
    <Card variant="borderless">
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-base font-medium">Danh sách vai trò</span>
          <div className="flex gap-2">
            <Button
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
        </div>

        <Row gutter={[16, 16]}>
          {listUserRoles.map((item) => (
            <Col key={item.roleId} xs={24} sm={12} md={8} lg={6}>
              <Card
                size="small"
                hoverable
                className={`cursor-pointer transition-all ${selectedRoles.includes(item.roleId) ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                onClick={() => {
                  if (selectedRoles.includes(item.roleId)) {
                    setSelectedRoles(selectedRoles.filter((id) => id !== item.roleId));
                  } else {
                    setSelectedRoles([...selectedRoles, item.roleId]);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{getRoleLabel(item.roleName)}</span>
                  <Checkbox checked={selectedRoles.includes(item.roleId)} onChange={(e) => handleChangeUserRole(e, item.roleId)} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </Card>
  );
};

export default UsersPage;
