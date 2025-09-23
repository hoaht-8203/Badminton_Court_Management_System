"use client";

import CreateNewSupplierDrawer from "@/components/quanlysancaulong/suppliers/create-new-supplier-drawer";
import SearchSupplier from "@/components/quanlysancaulong/suppliers/search-supplier";
import { columns } from "@/components/quanlysancaulong/suppliers/supplier-columns";
import UpdateSupplierDrawer from "@/components/quanlysancaulong/suppliers/update-supplier-drawer";
import { useChangeSupplierStatus, useDeleteSupplier, useListSuppliers } from "@/hooks/useSuppliers";
import { ApiError } from "@/lib/axios";
import { ListSupplierRequest, ListSupplierResponse } from "@/types-openapi/api";
import { SupplierStatus } from "@/types/commons";
import { CheckOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, StopOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Col, Divider, Modal, Row, Table, TableProps, message } from "antd";
import { useState } from "react";

const tableProps: TableProps<ListSupplierResponse> = {
  rowKey: "id",
  size: "small",
  scroll: { x: "max-content" },
  expandable: {
    expandRowByClick: true,
  },
  onRow: () => ({
    style: { cursor: "pointer" },
  }),
  bordered: true,
};

const SuppliersPage = () => {
  const [searchParams, setSearchParams] = useState<ListSupplierRequest>({});
  const [openCreateNewSupplierDrawer, setOpenCreateNewSupplierDrawer] = useState(false);
  const [openUpdateSupplierDrawer, setOpenUpdateSupplierDrawer] = useState(false);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [modal, contextHolder] = Modal.useModal();

  const { data: suppliersData, isFetching: loadingSuppliersData, refetch: refetchSuppliersData } = useListSuppliers(searchParams);

  const deleteSupplierMutation = useDeleteSupplier();
  const changeSupplierStatusMutation = useChangeSupplierStatus();

  const handleClickUpdateSupplier = (record: ListSupplierResponse) => {
    setOpenUpdateSupplierDrawer(true);
    setSupplierId(record.id ?? 0);
  };

  const handleClickDeleteSupplier = (record: ListSupplierResponse) => {
    modal.confirm({
      title: "Xác nhận",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa nhà cung cấp này?</p>
          <p>
            Lưu ý: Nhà cung cấp <span className="font-bold text-red-500">{record.name}</span> sẽ bị xóa vĩnh viễn và không thể khôi phục.
          </p>
        </div>
      ),
      onOk: () => {
        deleteSupplierMutation.mutate(
          { id: record.id ?? 0 },
          {
            onSuccess: () => message.success("Xóa nhà cung cấp thành công!"),
            onError: (error: ApiError) => message.error(error.message),
          },
        );
      },
      okText: "Xác nhận",
      cancelText: "Hủy",
    });
  };

  const handleClickChangeSupplierStatus = (record: ListSupplierResponse, status: string) => {
    modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn thay đổi trạng thái nhà cung cấp này?",
      onOk: () => {
        changeSupplierStatusMutation.mutate(
          { id: record.id ?? 0, status },
          {
            onSuccess: () => message.success("Cập nhật trạng thái nhà cung cấp thành công!"),
            onError: (error: ApiError) => message.error(error.message),
          },
        );
      },
    });
  };

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb items={[{ title: "Quản trị ứng dụng" }, { title: "Quản lý nhà cung cấp" }]} />
      </div>

      <div className="mb-2">
        <SearchSupplier onSearch={setSearchParams} onReset={() => setSearchParams({})} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số nhà cung cấp: {suppliersData?.data?.length ?? 0}</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreateNewSupplierDrawer(true)}>
              Thêm nhà cung cấp
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetchSuppliersData()}>
              Tải lại
            </Button>
          </div>
        </div>

        <Table<ListSupplierResponse>
          {...tableProps}
          columns={columns}
          dataSource={suppliersData?.data ?? []}
          loading={loadingSuppliersData}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => (
              <div>
                <SupplierInformation
                  record={record}
                  handleClickUpdateSupplier={() => handleClickUpdateSupplier(record)}
                  handleClickDeleteSupplier={() => handleClickDeleteSupplier(record)}
                  handleClickChangeSupplierStatus={(payload) => handleClickChangeSupplierStatus(record, payload)}
                />
              </div>
            ),
          }}
        />
      </div>

      <CreateNewSupplierDrawer open={openCreateNewSupplierDrawer} onClose={() => setOpenCreateNewSupplierDrawer(false)} />
      <UpdateSupplierDrawer open={openUpdateSupplierDrawer} onClose={() => setOpenUpdateSupplierDrawer(false)} supplierId={supplierId ?? 0} />

      {contextHolder}
    </section>
  );
};

const SupplierInformation = ({
  record,
  handleClickUpdateSupplier,
  handleClickDeleteSupplier,
  handleClickChangeSupplierStatus,
}: {
  record: ListSupplierResponse;
  handleClickUpdateSupplier: () => void;
  handleClickDeleteSupplier: () => void;
  handleClickChangeSupplierStatus: (payload: string) => void;
}) => {
  return (
    <div>
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <div className="mb-2">Mã NCC: {record.id}</div>
          <Divider size="small" />
          <div className="mb-2">Tên NCC: {record.name}</div>
          <Divider size="small" />
          <div className="mb-2">SĐT: {record.phone}</div>
          <Divider size="small" />
          <div className="mb-2">Email: {record.email}</div>
        </Col>
        <Divider type="vertical" size="small" style={{ height: "auto" }} />
        <Col span={8}>
          <div className="mb-2">Địa chỉ: {record.address || "-"}</div>
          <Divider size="small" />
          <div className="mb-2">Thành phố: {record.city || "-"}</div>
          <Divider size="small" />
          <div className="mb-2">Quận/Huyện: {record.district || "-"}</div>
          <Divider size="small" />
          <div className="mb-2">Phường/Xã: {record.ward || "-"}</div>
        </Col>
        <Divider type="vertical" size="small" style={{ height: "auto" }} />
        <Col span={7}>
          <div className="mb-2">Ghi chú: {record.notes || "-"}</div>
          <Divider size="small" />
          <div className="mb-2">
            Trạng thái:{" "}
            {record.status === SupplierStatus.Active ? (
              <span className="font-bold text-green-500">Đang hoạt động</span>
            ) : (
              <span className="font-bold text-red-500">Không hoạt động</span>
            )}
          </div>
        </Col>
      </Row>

      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button type="primary" icon={<EditOutlined />} onClick={handleClickUpdateSupplier}>
            Cập nhật nhà cung cấp
          </Button>
        </div>
        <div className="flex gap-2">
          <Button danger icon={<DeleteOutlined />} onClick={handleClickDeleteSupplier}>
            Xóa nhà cung cấp
          </Button>
          {record.status === SupplierStatus.Active && (
            <Button danger icon={<StopOutlined />} onClick={() => handleClickChangeSupplierStatus(SupplierStatus.Inactive)}>
              Ngừng hoạt động
            </Button>
          )}
          {record.status === SupplierStatus.Inactive && (
            <Button color="green" variant="outlined" icon={<CheckOutlined />} onClick={() => handleClickChangeSupplierStatus(SupplierStatus.Active)}>
              Kích hoạt
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuppliersPage;
