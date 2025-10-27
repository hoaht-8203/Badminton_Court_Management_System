"use client";

import CreateSliderDrawer from "@/components/quanlysancaulong/sliders/create-slider-drawer";
import { columns } from "@/components/quanlysancaulong/sliders/sliders-columns";
import SearchSliders from "@/components/quanlysancaulong/sliders/search-sliders";
import UpdateSliderDrawer from "@/components/quanlysancaulong/sliders/update-slider-drawer";
import { useDeleteSlider, useListSliders } from "@/hooks/useSlider";
import { ApiError } from "@/lib/axios";
import { ListSliderRequest, ListSliderResponse } from "@/types-openapi/api";
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Col, Divider, Image, message, Modal, Row, Table, TableProps } from "antd";
import { useMemo, useState } from "react";

const tableProps: TableProps<ListSliderResponse> = {
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

const SlidersPage = () => {
  const [searchParams, setSearchParams] = useState<ListSliderRequest>({
    title: null,
    status: null,
  });
  const [openCreateSliderDrawer, setOpenCreateSliderDrawer] = useState(false);
  const [openUpdateSliderDrawer, setOpenUpdateSliderDrawer] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedSlider, setSelectedSlider] = useState<ListSliderResponse | null>(null);
  const [sliderId, setSliderId] = useState<string | null>(null);
  const [modal, contextHolder] = Modal.useModal();

  const { data: slidersData, isFetching: loadingSlidersData, refetch: refetchSlidersData } = useListSliders(searchParams);

  const deleteSliderMutation = useDeleteSlider();

  const handleClickUpdateSlider = (record: ListSliderResponse) => {
    setOpenUpdateSliderDrawer(true);
    setSliderId(record.id?.toString() ?? null);
  };

  const handleClickViewImage = (record: ListSliderResponse) => {
    setSelectedSlider(record);
    setOpenImageModal(true);
  };

  const handleClickDeleteSlider = (record: ListSliderResponse) => {
    modal.confirm({
      title: "Xác nhận",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa slider này?</p>
          <p>
            Lưu ý: Slider <span className="font-bold text-red-500">{record.title}</span> sẽ bị xóa vĩnh viễn và không thể khôi phục.
          </p>
        </div>
      ),
      onOk: () => {
        deleteSliderMutation.mutate(
          {
            id: record.id ?? 0,
          },
          {
            onSuccess: () => {
              message.success("Xóa slider thành công!");
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
              title: "Quản lý slider",
            },
          ]}
        />
      </div>

      <div className="mb-2">
        <SearchSliders onSearch={setSearchParams} onReset={() => setSearchParams({ title: null, status: null })} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số slider: {slidersData?.data?.length ?? 0}</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreateSliderDrawer(true)}>
              Thêm slider
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetchSlidersData()}>
              Tải lại
            </Button>
          </div>
        </div>

        <Table<ListSliderResponse>
          {...tableProps}
          columns={columns}
          dataSource={slidersData?.data ?? []}
          loading={loadingSlidersData}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => (
              <div key={`slider-info-${record.id}`}>
                <SliderInformation
                  record={record}
                  handleClickUpdateSlider={() => handleClickUpdateSlider(record)}
                  handleClickDeleteSlider={() => handleClickDeleteSlider(record)}
                  handleClickViewImage={() => handleClickViewImage(record)}
                />
              </div>
            ),
          }}
        />
      </div>

      <CreateSliderDrawer open={openCreateSliderDrawer} onClose={() => setOpenCreateSliderDrawer(false)} />

      <UpdateSliderDrawer open={openUpdateSliderDrawer} onClose={() => setOpenUpdateSliderDrawer(false)} sliderId={sliderId ?? ""} />

      <Modal
        title="Hình ảnh slider"
        open={openImageModal}
        onCancel={() => setOpenImageModal(false)}
        footer={[
          <Button key="close" onClick={() => setOpenImageModal(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
        style={{ top: 20 }}
      >
        {selectedSlider && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{selectedSlider.title}</h3>
              <p className="text-sm text-gray-500">
                Tạo lúc: {selectedSlider.createdAt ? new Date(selectedSlider.createdAt).toLocaleString("vi-VN") : "-"}
              </p>
            </div>
            <div className="flex justify-center">
              {selectedSlider.imageUrl ? (
                <Image
                  src={selectedSlider.imageUrl}
                  alt={selectedSlider.title ?? ""}
                  className="max-h-96 max-w-full rounded object-contain"
                  preview={{
                    mask: "Xem ảnh",
                  }}
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded bg-gray-200">
                  <span className="text-gray-500">Không có hình ảnh</span>
                </div>
              )}
            </div>
            {selectedSlider.description && (
              <div className="mt-4">
                <h4 className="font-semibold">Mô tả:</h4>
                <p className="text-gray-700">{selectedSlider.description}</p>
              </div>
            )}
            {selectedSlider.backLink && (
              <div className="mt-2">
                <h4 className="font-semibold">Liên kết:</h4>
                <a href={selectedSlider.backLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {selectedSlider.backLink}
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      {contextHolder}
    </section>
  );
};

const SliderInformation = ({
  record,
  handleClickUpdateSlider,
  handleClickDeleteSlider,
  handleClickViewImage,
}: {
  record: ListSliderResponse;
  handleClickUpdateSlider: () => void;
  handleClickDeleteSlider: () => void;
  handleClickViewImage: () => void;
}) => {
  const sliderInfo = useMemo(
    () => (
      <div>
        <Row gutter={16} className="mb-4">
          <Col span={8}>
            <Row gutter={16}>
              <Col span={6}>Mã slider:</Col>
              <Col span={18}>{record.id ?? "-"}</Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={6}>Tiêu đề:</Col>
              <Col span={18}>{record.title}</Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={6}>Trạng thái:</Col>
              <Col span={18}>
                {record.status === "Active" ? (
                  <span className="font-bold text-green-500">Đang hoạt động</span>
                ) : (
                  <span className="font-bold text-red-500">Không hoạt động</span>
                )}
              </Col>
            </Row>
          </Col>
          <Divider type="vertical" size="small" style={{ height: "auto" }} />
          <Col span={8}>
            <Row gutter={16}>
              <Col span={6}>Hình ảnh:</Col>
              <Col span={18}>
                {record.imageUrl ? (
                  <Image src={record.imageUrl} alt={record.title ?? ""} width={300} className="rounded object-cover" preview={false} />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded bg-gray-200">
                    <span className="text-gray-500">Không có hình</span>
                  </div>
                )}
              </Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={6}>Ngày tạo:</Col>
              <Col span={18}>{record.createdAt ? new Date(record.createdAt).toLocaleString("vi-VN") : "-"}</Col>
              <Col span={24}>
                <Divider size="small" />
              </Col>
              <Col span={6}>Cập nhật:</Col>
              <Col span={18}>{record.updatedAt ? new Date(record.updatedAt).toLocaleString("vi-VN") : "-"}</Col>
            </Row>
          </Col>
          <Divider type="vertical" size="small" style={{ height: "auto" }} />
        </Row>

        <div className="flex justify-end">
          <div className="flex gap-2">
            <Button type="primary" icon={<EditOutlined />} onClick={handleClickUpdateSlider}>
              Cập nhật slider
            </Button>
            <Button icon={<EyeOutlined />} onClick={handleClickViewImage}>
              Xem hình ảnh
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleClickDeleteSlider}>
              Xóa slider
            </Button>
          </div>
        </div>
      </div>
    ),
    [record, handleClickUpdateSlider, handleClickDeleteSlider, handleClickViewImage],
  );

  return sliderInfo;
};

export default SlidersPage;
