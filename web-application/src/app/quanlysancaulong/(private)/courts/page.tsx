"use client";

import CreateNewCourtDrawer from "@/components/quanlysancaulong/courts/create-new-court-drawer";
import { columns } from "@/components/quanlysancaulong/courts/courts-columns";
import SearchCourt from "@/components/quanlysancaulong/courts/search-court";
import UpdateCourtDrawer from "@/components/quanlysancaulong/courts/update-court-drawer";
import { useChangeCourtStatus, useDeleteCourt, useListCourts } from "@/hooks/useCourt";
import { ApiError } from "@/lib/axios";
import { ListCourtRequest, ListCourtResponse } from "@/types-openapi/api";
import { CourtStatus } from "@/types/commons";
import { CheckOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, StopOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Col, Divider, Modal, Row, Table, TableProps, message } from "antd";
import { useState } from "react";

const tableProps: TableProps<ListCourtResponse> = {
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

const CourtPage = () => {
  const [searchParams, setSearchParams] = useState<ListCourtRequest>({});
  const [openCreateDrawer, setOpenCreateDrawer] = useState(false);
  const [openUpdateDrawer, setOpenUpdateDrawer] = useState(false);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [modal, contextHolder] = Modal.useModal();

  const { data: courtsData, isFetching: loadingCourts, refetch } = useListCourts(searchParams);

  const deleteCourtMutation = useDeleteCourt();
  const changeCourtStatusMutation = useChangeCourtStatus();

  const handleClickUpdate = (record: ListCourtResponse) => {
    setOpenUpdateDrawer(true);
    setCourtId(record.id ?? null);
  };

  const handleClickDelete = (record: ListCourtResponse) => {
    modal.confirm({
      title: "Xác nhận",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa sân này?</p>
          <p>
            Lưu ý: Sân <span className="font-bold text-red-500">{record.name}</span> sẽ bị xóa vĩnh viễn và không thể khôi phục.
          </p>
        </div>
      ),
      onOk: () => {
        deleteCourtMutation.mutate(
          { id: record.id ?? "" },
          {
            onSuccess: () => message.success("Xóa sân thành công!"),
            onError: (error: ApiError) => message.error(error.message),
          },
        );
      },
      okText: "Xác nhận",
      cancelText: "Hủy",
    });
  };

  const handleClickChangeStatus = (record: ListCourtResponse, status: string) => {
    modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn thay đổi trạng thái sân này?",
      onOk: () => {
        changeCourtStatusMutation.mutate(
          { id: record.id ?? "", status },
          {
            onSuccess: () => message.success("Cập nhật trạng thái sân thành công!"),
            onError: (error: ApiError) => message.error(error.message),
          },
        );
      },
    });
  };

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb items={[{ title: "Quản trị ứng dụng" }, { title: "Quản lý sân" }]} />
      </div>

      <div className="mb-2">
        <SearchCourt onSearch={setSearchParams} onReset={() => setSearchParams({})} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số sân: {courtsData?.data?.length ?? 0}</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreateDrawer(true)}>
              Thêm sân
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetch()}>
              Tải lại
            </Button>
          </div>
        </div>

        <Table<ListCourtResponse>
          {...tableProps}
          columns={columns}
          dataSource={courtsData?.data ?? []}
          loading={loadingCourts}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => (
              <div>
                <CourtInformation
                  record={record}
                  handleClickUpdate={() => handleClickUpdate(record)}
                  handleClickDelete={() => handleClickDelete(record)}
                  handleClickChangeStatus={(payload) => handleClickChangeStatus(record, payload)}
                />
              </div>
            ),
          }}
        />
      </div>

      <CreateNewCourtDrawer open={openCreateDrawer} onClose={() => setOpenCreateDrawer(false)} />
      <UpdateCourtDrawer open={openUpdateDrawer} onClose={() => setOpenUpdateDrawer(false)} courtId={courtId ?? ""} />

      {contextHolder}
    </section>
  );
};

const CourtInformation = ({
  record,
  handleClickUpdate,
  handleClickDelete,
  handleClickChangeStatus,
}: {
  record: ListCourtResponse;
  handleClickUpdate: () => void;
  handleClickDelete: () => void;
  handleClickChangeStatus: (payload: string) => void;
}) => {
  return (
    <div>
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <div className="mb-2">Mã sân: {record.id}</div>
          <Divider size="small" />
          <div className="mb-2">Tên sân: {record.name}</div>
        </Col>
        <Divider type="vertical" size="small" style={{ height: "auto" }} />
        <Col span={8}>
          <div className="mb-2">Khu vực: {record.courtAreaName}</div>
          <Divider size="small" />
          <div className="mb-2">Ghi chú: {record.note || "-"}</div>
        </Col>
        <Divider type="vertical" size="small" style={{ height: "auto" }} />
        <Col span={7}>
          <div className="mb-2">
            Trạng thái:{" "}
            {record.status === CourtStatus.Active ? (
              <span className="font-bold text-green-500">Đang hoạt động</span>
            ) : record.status === CourtStatus.Maintenance ? (
              <span className="font-bold text-yellow-600">Bảo trì</span>
            ) : (
              <span className="font-bold text-red-500">Không hoạt động</span>
            )}
          </div>
        </Col>
      </Row>

      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button type="primary" icon={<EditOutlined />} onClick={handleClickUpdate}>
            Cập nhật sân
          </Button>
        </div>
        <div className="flex gap-2">
          <Button danger icon={<DeleteOutlined />} onClick={handleClickDelete}>
            Xóa sân
          </Button>
          {record.status !== CourtStatus.Inactive && (
            <Button danger icon={<StopOutlined />} onClick={() => handleClickChangeStatus(CourtStatus.Inactive)}>
              Ngừng hoạt động
            </Button>
          )}
          {record.status !== CourtStatus.Active && (
            <Button color="green" variant="outlined" icon={<CheckOutlined />} onClick={() => handleClickChangeStatus(CourtStatus.Active)}>
              Kích hoạt
            </Button>
          )}
          {record.status !== CourtStatus.Maintenance && (
            <Button icon={<StopOutlined />} onClick={() => handleClickChangeStatus(CourtStatus.Maintenance)}>
              Chuyển bảo trì
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourtPage;
