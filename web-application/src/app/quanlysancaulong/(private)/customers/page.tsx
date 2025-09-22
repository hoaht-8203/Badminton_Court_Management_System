"use client";

import CreateNewCustomerDrawer from "@/components/quanlysancaulong/customers/create-new-customer-drawer";
import { columns } from "@/components/quanlysancaulong/customers/customers-columns";
import SearchCustomers from "@/components/quanlysancaulong/customers/search-customers";
import UpdateCustomerDrawer from "@/components/quanlysancaulong/customers/update-customer-drawer";
import { useDeleteCustomer, useListCustomers } from "@/hooks/useCustomers";
import { ApiError } from "@/lib/axios";
import { ListCustomerRequest, ListCustomerResponse } from "@/types-openapi/api";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Col, Divider, message, Modal, Row, Table, TableProps, Tag } from "antd";
import { useState } from "react";

const tableProps: TableProps<ListCustomerResponse> = {
  rowKey: "id",
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

const CustomersPage = () => {
  const [searchParams, setSearchParams] = useState<ListCustomerRequest>({
    fullName: null,
  });
  const [openCreateNewCustomerDrawer, setOpenCreateNewCustomerDrawer] = useState(false);
  const [openUpdateCustomerDrawer, setOpenUpdateCustomerDrawer] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [modal, contextHolder] = Modal.useModal();

  const { data: customersData, isFetching: loadingCustomersData, refetch: refetchCustomersData } = useListCustomers(searchParams);

  const deleteCustomerMutation = useDeleteCustomer();

  const handleClickUpdateCustomer = (record: ListCustomerResponse) => {
    setOpenUpdateCustomerDrawer(true);
    setCustomerId(record.id ?? 0);
  };

  const handleClickDeleteCustomer = (record: ListCustomerResponse) => {
    modal.confirm({
      title: "Xác nhận",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa khách hàng này?</p>
          <p>
            Lưu ý: Khách hàng <span className="font-bold text-red-500">{record.fullName}</span> sẽ bị xóa vĩnh viễn và không thể khôi phục.
          </p>
        </div>
      ),
      onOk: () => {
        deleteCustomerMutation.mutate(
          {
            id: record.id ?? 0,
          },
          {
            onSuccess: () => {
              message.success("Xóa khách hàng thành công!");
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
              title: "Quản lý khách hàng",
            },
          ]}
        />
      </div>

      <div className="mb-2">
        <SearchCustomers onSearch={setSearchParams} onReset={() => setSearchParams({ fullName: null })} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số khách hàng: {customersData?.data?.length ?? 0}</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreateNewCustomerDrawer(true)}>
              Thêm khách hàng
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetchCustomersData()}>
              Tải lại
            </Button>
          </div>
        </div>

        <Table<ListCustomerResponse>
          {...tableProps}
          columns={columns}
          dataSource={customersData?.data ?? []}
          loading={loadingCustomersData}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => (
              <div>
                <CustomerInformation
                  record={record}
                  handleClickUpdateCustomer={() => handleClickUpdateCustomer(record)}
                  handleClickDeleteCustomer={() => handleClickDeleteCustomer(record)}
                />
              </div>
            ),
          }}
        />
      </div>

      <CreateNewCustomerDrawer open={openCreateNewCustomerDrawer} onClose={() => setOpenCreateNewCustomerDrawer(false)} />

      <UpdateCustomerDrawer open={openUpdateCustomerDrawer} onClose={() => setOpenUpdateCustomerDrawer(false)} customerId={customerId ?? 0} />

      {contextHolder}
    </section>
  );
};

const CustomerInformation = ({
  record,
  handleClickUpdateCustomer,
  handleClickDeleteCustomer,
}: {
  record: ListCustomerResponse;
  handleClickUpdateCustomer: () => void;
  handleClickDeleteCustomer: () => void;
}) => {
  return (
    <div>
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Row gutter={16}>
            <Col span={8}>Mã khách hàng:</Col>
            <Col span={16}>{record.id}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={8}>Họ tên:</Col>
            <Col span={16}>{record.fullName}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={8}>SĐT:</Col>
            <Col span={16}>{record.phoneNumber}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={8}>Email:</Col>
            <Col span={16}>{record.email}</Col>
          </Row>
        </Col>
        <Col span={8}>
          <Row gutter={16}>
            <Col span={8}>Giới tính:</Col>
            <Col span={16}>{record.gender}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={8}>Ngày sinh:</Col>
            <Col span={16}>{record.dateOfBirth ? new Date(record.dateOfBirth).toLocaleDateString("vi-VN") : "-"}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={8}>CMND/CCCD:</Col>
            <Col span={16}>{record.idCard || "-"}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={8}>Trạng thái:</Col>
            <Col span={16}>
              {record.status ? (
                <Tag color={record.status === "Active" ? "green" : record.status === "Inactive" ? "red" : "default"}>{record.status}</Tag>
              ) : (
                "-"
              )}
            </Col>
          </Row>
        </Col>
        <Col span={8}>
          <Row gutter={16}>
            <Col span={8}>Địa chỉ:</Col>
            <Col span={16}>{record.address || "-"}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={8}>Thành phố:</Col>
            <Col span={16}>{record.city || "-"}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={8}>Quận/Huyện:</Col>
            <Col span={16}>{record.district || "-"}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={8}>Phường/Xã:</Col>
            <Col span={16}>{record.ward || "-"}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={8}>Ghi chú:</Col>
            <Col span={16}>{record.note || "-"}</Col>
          </Row>
        </Col>
      </Row>

      <div className="flex gap-2">
        <Button type="primary" icon={<EditOutlined />} onClick={handleClickUpdateCustomer}>
          Cập nhật khách hàng
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleClickDeleteCustomer}>
          Xóa khách hàng
        </Button>
      </div>
    </div>
  );
};

export default CustomersPage;
