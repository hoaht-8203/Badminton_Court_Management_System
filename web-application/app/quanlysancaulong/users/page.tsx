"use client";

import {
  ListAdministratorRequest,
  ListAdministratorResponse,
} from "@/types-openapi/api";
import { Breadcrumb, Button, Col, Divider, Row, Table, Tabs } from "antd";
import { useState } from "react";
import SearchUser from "./search-users";
import { columns } from "./column";
import { useListAdministrators } from "@/hooks/useUsers";
import {
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
} from "@ant-design/icons";
import CreateNewUserDrawer from "./create-new-user-drawer";
import UpdateUserDrawer from "./update-user-drawer";

const page = () => {
  const [searchParams, setSearchParams] = useState<ListAdministratorRequest>({
    keyword: null,
    role: null,
    status: null,
  });
  const [openCreateNewUserDrawer, setOpenCreateNewUserDrawer] = useState(false);
  const [openUpdateUserDrawer, setOpenUpdateUserDrawer] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const {
    data: usersData,
    isFetching: loadingUsersData,
    error: errorUsersData,
    refetch: refetchUsersData,
  } = useListAdministrators(searchParams);

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
          columns={columns}
          dataSource={usersData?.data ?? []}
          bordered
          loading={loadingUsersData}
          rowKey="userId"
          size="small"
          scroll={{ x: "max-content" }}
          expandable={{
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
                          handleClickUpdateUser={() => {
                            setOpenUpdateUserDrawer(true);
                            setUserId(record.userId ?? "");
                          }}
                        />
                      ),
                    },
                    {
                      key: "2",
                      label: "Quản lý vai trò người dùng",
                      children: <div>Quản lý vai trò người dùng</div>,
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
    </section>
  );
};

const UserInformation = ({
  record,
  handleClickUpdateUser,
}: {
  record: ListAdministratorResponse;
  handleClickUpdateUser: () => void;
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
            <Col span={12}>{record.dateOfBirth?.toLocaleDateString()}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
          </Row>
        </Col>

        <Col span={6}>
          <Row gutter={16}>
            <Col span={4}>Ghi chú:</Col>
            <Col span={20}>{record.note}</Col>
          </Row>
        </Col>
      </Row>

      <div className="flex gap-2">
        <Button color="danger" variant="outlined" icon={<StopOutlined />}>
          Ngừng hoạt động
        </Button>
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

export default page;
