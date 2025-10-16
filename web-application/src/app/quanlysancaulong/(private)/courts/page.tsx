"use client";

import { columns } from "@/components/quanlysancaulong/courts/courts-columns";
import CreateNewCourtDrawer from "@/components/quanlysancaulong/courts/create-new-court-drawer";
import ManageCourtPricingRuleTemplateDrawer from "@/components/quanlysancaulong/courts/manage-court-pricing-rule-template-drawer";
import SearchCourt from "@/components/quanlysancaulong/courts/search-court";
import UpdateCourtDrawer from "@/components/quanlysancaulong/courts/update-court-drawer";
import { useChangeCourtStatus, useListCourts } from "@/hooks/useCourt";
import { ApiError } from "@/lib/axios";
import { ListCourtRequest, ListCourtResponse } from "@/types-openapi/api";
import { CourtStatus } from "@/types/commons";
import { CheckOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SettingOutlined, StopOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Col, Divider, Image, List, Modal, Row, Table, TableProps, Tag, Typography, message } from "antd";
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
  const [openManagePricingRuleTemplateDrawer, setOpenManagePricingRuleTemplateDrawer] = useState(false);
  const [openCreateDrawer, setOpenCreateDrawer] = useState(false);
  const [openUpdateDrawer, setOpenUpdateDrawer] = useState(false);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [modal, contextHolder] = Modal.useModal();

  const { data: courtsData, isFetching: loadingCourts, refetch } = useListCourts(searchParams);

  const changeCourtStatusMutation = useChangeCourtStatus();

  const handleClickUpdate = (record: ListCourtResponse) => {
    setOpenUpdateDrawer(true);
    setCourtId(record.id ?? null);
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

  const handleClickManagePricingRuleTemplate = () => {
    setOpenManagePricingRuleTemplateDrawer(true);
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
            <Button type="primary" icon={<SettingOutlined />} onClick={handleClickManagePricingRuleTemplate}>
              Quản lý cấu hình giá sân theo khung Giờ
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
                  handleClickChangeStatus={(payload) => handleClickChangeStatus(record, payload)}
                />
              </div>
            ),
          }}
        />
      </div>

      <CreateNewCourtDrawer open={openCreateDrawer} onClose={() => setOpenCreateDrawer(false)} />
      <UpdateCourtDrawer open={openUpdateDrawer} onClose={() => setOpenUpdateDrawer(false)} courtId={courtId ?? ""} />
      <ManageCourtPricingRuleTemplateDrawer
        open={openManagePricingRuleTemplateDrawer}
        onClose={() => setOpenManagePricingRuleTemplateDrawer(false)}
      />

      {contextHolder}
    </section>
  );
};

const CourtInformation = ({
  record,
  handleClickUpdate,
  handleClickChangeStatus,
}: {
  record: ListCourtResponse;
  handleClickUpdate: () => void;
  handleClickChangeStatus: (payload: string) => void;
}) => {
  const dayLabel = (d: number) =>
    d === 2 ? "T2" : d === 3 ? "T3" : d === 4 ? "T4" : d === 5 ? "T5" : d === 6 ? "T6" : d === 7 ? "T7" : d === 8 ? "CN" : String(d);
  return (
    <div>
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <div className="mb-2">Mã sân: {record.id}</div>
          <Divider size="small" />
          <div className="mb-2">Tên sân: {record.name}</div>
          <div className="mb-2">
            Ảnh sân:
            <div className="">
              {record.imageUrl ? (
                <Image
                  src={record.imageUrl}
                  alt="court"
                  width={150}
                  height={150}
                  style={{ objectFit: "cover", border: "1px dashed #ccc", padding: "4px" }}
                />
              ) : (
                <div className="flex h-[150px] w-[150px] items-center justify-center border border-dashed border-gray-300">
                  <span className="text-gray-500">Không có ảnh</span>
                </div>
              )}
            </div>
          </div>
        </Col>
        <Divider type="vertical" size="small" style={{ height: "auto" }} />
        <Col span={6}>
          <div className="mb-2">Khu vực: {record.courtAreaName}</div>
          <Divider size="small" />
          <div className="mb-2">
            Trạng thái:{" "}
            {record.status === CourtStatus.Active ? (
              <span className="font-bold text-green-500">Đang hoạt động</span>
            ) : record.status === CourtStatus.Maintenance ? (
              <span className="font-bold text-yellow-600">Bảo trì</span>
            ) : record.status === CourtStatus.Inactive ? (
              <span className="font-bold text-red-500">Không hoạt động</span>
            ) : record.status === CourtStatus.InUse ? (
              <span className="font-bold text-blue-500">Đang sử dụng</span>
            ) : (
              <span className="font-bold text-gray-500">Không xác định</span>
            )}
          </div>
          <Divider size="small" />
          <div className="mb-2">Ghi chú: {record.note || "-"}</div>
        </Col>
        <Divider type="vertical" size="small" style={{ height: "auto" }} />
        <Col span={7}>
          <Divider orientation="left" size="small">
            Bảng giá theo khung giờ
          </Divider>
          <List
            bordered
            dataSource={record.courtPricingRules ?? []}
            locale={{ emptyText: "Chưa có cấu hình giá" }}
            renderItem={(item) => (
              <List.Item>
                <div className="w-full">
                  <div className="mb-1">
                    {(item.daysOfWeek ?? []).map((d) => (
                      <Tag key={d}>{dayLabel(d)}</Tag>
                    ))}
                  </div>
                  <Typography.Text>
                    {`Khung giờ: ${item.startTime} - ${item.endTime} | Giá: ${Number(item.pricePerHour ?? 0).toLocaleString("vi-VN")}₫/giờ`}
                  </Typography.Text>
                </div>
              </List.Item>
            )}
          />
        </Col>
      </Row>

      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button type="primary" icon={<EditOutlined />} onClick={handleClickUpdate}>
            Cập nhật sân
          </Button>
        </div>
        <div className="flex gap-2">
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
