"use client";

import {
  ChangeUserStatusRequest,
  ListAdministratorRequest,
  ListAdministratorResponse,
} from "@/types-openapi/api";
import {
  Breadcrumb,
  Button,
  Col,
  Divider,
  List,
  message,
  Modal,
  Row,
  Table,
  TableProps,
  Tabs,
} from "antd";
import { useState } from "react";
import SearchUser from "./search-users";
import { columns } from "./column";
import { useChangeUserStatus, useListAdministrators } from "@/hooks/useUsers";
import {
  CheckOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
} from "@ant-design/icons";
import CreateNewUserDrawer from "./create-new-user-drawer";
import UpdateUserDrawer from "./update-user-drawer";
import dayjs from "dayjs";
import { ApplicationUserStatus } from "@/types/commons";
import { ApiError } from "@/lib/axios";

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

const page = () => {
  const [searchParams, setSearchParams] = useState<ListAdministratorRequest>({
    keyword: null,
    role: null,
    status: null,
  });
  const [openCreateNewUserDrawer, setOpenCreateNewUserDrawer] = useState(false);
  const [openUpdateUserDrawer, setOpenUpdateUserDrawer] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [modal, contextHolder] = Modal.useModal();

  const {
    data: usersData,
    isFetching: loadingUsersData,
    error: errorUsersData,
    refetch: refetchUsersData,
  } = useListAdministrators(searchParams);

  const changeUserStatusMutation = useChangeUserStatus();

  const handleClickUpdateUser = (record: ListAdministratorResponse) => {
    setOpenUpdateUserDrawer(true);
    setUserId(record.userId ?? "");
  };

  const handleClickChangeUserStatus = (
    status: string,
    record: ListAdministratorResponse
  ) => {
    if (status === ApplicationUserStatus.Inactive) {
      modal.confirm({
        title: "Xác nhận",
        content: (
          <div>
            <p>Bạn có chắc chắn muốn ngừng hoạt động người dùng này?</p>
            <p>
              Lưu ý: Người dùng này sẽ{" "}
              <span className="font-bold text-red-500">
                không thể đăng nhập
              </span>{" "}
              vào hệ thống sau khi ngừng hoạt động.
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
            }
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
            }
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
        <SearchUser
          onSearch={setSearchParams}
          onReset={() =>
            setSearchParams({ keyword: null, role: null, status: null })
          }
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="font-bold text-green-500">
              Tổng số người dùng: {usersData?.data?.length ?? 0}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpenCreateNewUserDrawer(true)}
            >
              Thêm người dùng
            </Button>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => refetchUsersData()}
            >
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
                          handleClickUpdateUser={() =>
                            handleClickUpdateUser(record)
                          }
                          handleClickChangeUserStatus={(status) => {
                            handleClickChangeUserStatus(status, record);
                          }}
                        />
                      ),
                    },
                    {
                      key: "2",
                      label: "Quản lý vai trò người dùng",
                      children: <UserRoleManagement record={record} />,
                    },
                  ]}
                />
              </div>
            ),
          }}
        />
      </div>

      <CreateNewUserDrawer
        open={openCreateNewUserDrawer}
        onClose={() => setOpenCreateNewUserDrawer(false)}
      />

      <UpdateUserDrawer
        open={openUpdateUserDrawer}
        onClose={() => setOpenUpdateUserDrawer(false)}
        userId={userId ?? ""}
      />

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
            <Col span={12}>
              {record.dateOfBirth
                ? dayjs(record.dateOfBirth).format("DD/MM/YYYY")
                : "-"}
            </Col>
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
            onClick={() =>
              handleClickChangeUserStatus(ApplicationUserStatus.Inactive)
            }
          >
            Ngừng hoạt động
          </Button>
        )}

        {record.status === ApplicationUserStatus.Inactive && (
          <Button
            color="green"
            variant="outlined"
            icon={<CheckOutlined />}
            onClick={() =>
              handleClickChangeUserStatus(ApplicationUserStatus.Active)
            }
          >
            Kích hoạt
          </Button>
        )}
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={handleClickUpdateUser}
        >
          Cập nhật thông tin
        </Button>
      </div>
    </div>
  );
};

const UserRoleManagement = ({
  record,
}: {
  record: ListAdministratorResponse;
}) => {
  return (
    <>
      <Row gutter={16}>
        <Col span={4}>
          <List
            size="small"
            bordered
            dataSource={record.roles ?? []}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </Col>
        <Col span={20}>
          <Button type="primary" icon={<PlusOutlined />}>
            Thêm vai trò
          </Button>
        </Col>
      </Row>
    </>
  );
};

export default page;
