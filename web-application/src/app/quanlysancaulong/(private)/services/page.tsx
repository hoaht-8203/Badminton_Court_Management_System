"use client";

import CreateNewServiceDrawer from "@/components/quanlysancaulong/services/create-new-service-drawer";
import { columns } from "@/components/quanlysancaulong/services/services-columns";
import SearchServices from "@/components/quanlysancaulong/services/search-services";
import UpdateServiceDrawer from "@/components/quanlysancaulong/services/update-service-drawer";
import { useChangeServiceStatus, useListServices } from "@/hooks/useServices";
import { ApiError } from "@/lib/axios";
import { ListServiceRequest, ListServiceResponse } from "@/types-openapi/api";
import { ServiceStatus } from "@/types/commons";
import { CheckOutlined, EditOutlined, PlusOutlined, ReloadOutlined, StopOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Col, Divider, message, Modal, Row, Table, TableProps } from "antd";
import { useMemo, useState } from "react";

const tableProps: TableProps<ListServiceResponse> = {
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

const ServicesPage = () => {
  const [searchParams, setSearchParams] = useState<ListServiceRequest>({
    name: null,
    category: null,
    status: null,
  });
  const [openCreateNewServiceDrawer, setOpenCreateNewServiceDrawer] = useState(false);
  const [openUpdateServiceDrawer, setOpenUpdateServiceDrawer] = useState(false);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [modal, contextHolder] = Modal.useModal();

  const { data: servicesData, isFetching: loadingServicesData, refetch: refetchServicesData } = useListServices(searchParams);

  const changeServiceStatusMutation = useChangeServiceStatus();

  const handleClickUpdateService = (record: ListServiceResponse) => {
    setOpenUpdateServiceDrawer(true);
    setServiceId(record.id ?? "");
  };

  const handleClickChangeServiceStatus = (record: ListServiceResponse, status: string) => {
    modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn ngừng hoạt động dịch vụ này?",
      onOk: () => {
        changeServiceStatusMutation.mutate(
          {
            id: record.id ?? "",
            status: status,
          },
          {
            onSuccess: () => {
              message.success("Cập nhật trạng thái dịch vụ thành công!");
            },
            onError: (error: ApiError) => {
              message.error(error.message);
            },
          },
        );
      },
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
              title: "Quản lý dịch vụ",
            },
          ]}
        />
      </div>

      <div className="mb-2">
        <SearchServices onSearch={setSearchParams} onReset={() => setSearchParams({ name: null, category: null, status: null })} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số dịch vụ: {servicesData?.data?.length ?? 0}</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreateNewServiceDrawer(true)}>
              Thêm dịch vụ
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetchServicesData()}>
              Tải lại
            </Button>
          </div>
        </div>

        <Table<ListServiceResponse>
          {...tableProps}
          columns={columns}
          dataSource={servicesData?.data ?? []}
          loading={loadingServicesData}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => (
              <div key={`service-info-${record.id}`}>
                <ServiceInformation
                  record={record}
                  handleClickUpdateService={() => handleClickUpdateService(record)}
                  handleClickChangeServiceStatus={(payload) => handleClickChangeServiceStatus(record, payload)}
                />
              </div>
            ),
          }}
        />
      </div>

      <CreateNewServiceDrawer open={openCreateNewServiceDrawer} onClose={() => setOpenCreateNewServiceDrawer(false)} />

      <UpdateServiceDrawer open={openUpdateServiceDrawer} onClose={() => setOpenUpdateServiceDrawer(false)} serviceId={serviceId ?? ""} />

      {contextHolder}
    </section>
  );
};

const ServiceInformation = ({
  record,
  handleClickUpdateService,
  handleClickChangeServiceStatus,
}: {
  record: ListServiceResponse;
  handleClickUpdateService: () => void;
  handleClickChangeServiceStatus: (payload: string) => void;
}) => {
  const serviceInfo = useMemo(
    () => (
      <div>
        <Row gutter={16} className="mb-4">
          <Col span={7}>
            <Row gutter={16}>
              <Col span={8}>Mã dịch vụ:</Col>
              <Col span={16}>{record.id}</Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={8}>Tên dịch vụ:</Col>
              <Col span={16}>{record.name}</Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={8}>Mô tả:</Col>
              <Col span={16}>{record.description || "-"}</Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={8}>Giá/giờ:</Col>
              <Col span={16}>{record.pricePerHour ? `${record.pricePerHour.toLocaleString("vi-VN")} VND` : "-"}</Col>
            </Row>
          </Col>
          <Divider type="vertical" size="small" style={{ height: "auto" }} />
          <Col span={7}>
            <Row gutter={16}>
              <Col span={8}>Danh mục:</Col>
              <Col span={16}>{record.category || "-"}</Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={8}>Đơn vị:</Col>
              <Col span={16}>{record.unit || "-"}</Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={8}>Số lượng:</Col>
              <Col span={16}>{record.stockQuantity || 0}</Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={8}>Trạng thái:</Col>
              <Col span={16}>
                {record.status === ServiceStatus.Active ? (
                  <span className="font-bold text-green-500">Đang hoạt động</span>
                ) : (
                  <span className="font-bold text-red-500">Không hoạt động</span>
                )}
              </Col>
            </Row>
          </Col>
          <Divider type="vertical" size="small" style={{ height: "auto" }} />
          <Col span={7}>
            <Row gutter={16}>
              <Col span={8}>Ghi chú:</Col>
              <Col span={16}>{record.note || "-"}</Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
            </Row>
          </Col>
        </Row>

        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button type="primary" icon={<EditOutlined />} onClick={handleClickUpdateService}>
              Cập nhật dịch vụ
            </Button>
          </div>
          <div className="flex gap-2">
            {record.status === ServiceStatus.Active && (
              <Button danger icon={<StopOutlined />} onClick={() => handleClickChangeServiceStatus(ServiceStatus.Inactive)}>
                Ngừng hoạt động
              </Button>
            )}
            {record.status === ServiceStatus.Inactive && (
              <Button color="green" variant="outlined" icon={<CheckOutlined />} onClick={() => handleClickChangeServiceStatus(ServiceStatus.Active)}>
                Kích hoạt
              </Button>
            )}
          </div>
        </div>
      </div>
    ),
    [record, handleClickUpdateService, handleClickChangeServiceStatus],
  );

  return serviceInfo;
};

export default ServicesPage;
