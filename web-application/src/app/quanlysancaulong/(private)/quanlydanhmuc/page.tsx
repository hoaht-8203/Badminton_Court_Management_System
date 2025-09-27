"use client";

import { useDeleteProduct, useListProducts, useUpdateProduct, useDetailProduct } from "@/hooks/useProducts";
import { ApiError, axiosInstance } from "@/lib/axios";
import { DetailProductResponse, ListProductRequest, ListProductResponse } from "@/types-openapi/api";
import { Breadcrumb, Button, Col, Divider, Image, message, Modal, Row, Table, TableProps } from "antd";
import { useMemo, useState } from "react";
import { productColumns } from "@/components/quanlysancaulong/products/products-columns";
import CreateNewProductDrawer from "@/components/quanlysancaulong/products/create-new-product-drawer";
import UpdateProductDrawer from "@/components/quanlysancaulong/products/update-product-drawer";
import SearchProducts from "@/components/quanlysancaulong/products/search-products";
import { CheckOutlined, DeleteOutlined, EditOutlined, StopOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";

type ProductFilters = ListProductRequest & { priceSort?: "ascend" | "descend"; isActive?: boolean };

const tableProps: TableProps<ListProductResponse> = {
  rowKey: "id",
  size: "small",
  scroll: { x: "max-content" },
  bordered: true,
  expandable: { expandRowByClick: true },
};

const ProductCategoryPage = () => {
  const [searchParams, setSearchParams] = useState<ProductFilters>({});
  const [openCreate, setOpenCreate] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [modal, contextHolder] = Modal.useModal();

  const { data, isFetching, refetch } = useListProducts(searchParams);
  const deleteMutation = useDeleteProduct();
  const updateMutation = useUpdateProduct();

  const tableData = useMemo(() => {
    let arr = [...(data?.data ?? [])];
    if (typeof searchParams.isActive === "boolean") {
      arr = arr.filter((x) => (!!x.isActive) === searchParams.isActive);
    }
    if (searchParams.priceSort === "ascend") {
      arr.sort((a, b) => (a.salePrice ?? 0) - (b.salePrice ?? 0));
    } else if (searchParams.priceSort === "descend") {
      arr.sort((a, b) => (b.salePrice ?? 0) - (a.salePrice ?? 0));
    }
    return arr;
  }, [data?.data, searchParams.isActive, searchParams.priceSort]);

  const updateStatus = async (id: number, isActive: boolean) => {
    await axiosInstance.put("/api/Products/update-status", undefined, { params: { id, isActive } });
  };

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb items={[{ title: "Quản lý hàng hoá" }, { title: "Quản lý danh mục" }]} />
      </div>

      <div className="mb-2">
        <SearchProducts onSearch={setSearchParams} onReset={() => setSearchParams({})} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số hàng hóa: {tableData.length}</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreate(true)}>
              Thêm hàng hóa
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetch()}>
              Tải lại
            </Button>
          </div>
        </div>

        <Table<ListProductResponse>
        {...tableProps}
        columns={[...productColumns!]}
        dataSource={tableData}
        loading={isFetching}
        expandable={{
          expandRowByClick: true,
          expandedRowRender: (record) => (
            <ProductInformation
              record={record}
              onEdit={() => {
                setCurrentId(record.id!);
                setOpenUpdate(true);
              }}
              onDelete={() => {
                modal.confirm({
                  title: "Xác nhận",
                  content: `Xóa hàng hóa ${record.name}?`,
                  onOk: () =>
                    deleteMutation.mutate(
                      { id: record.id! },
                      { onSuccess: () => message.success("Xóa thành công"), onError: (e: ApiError) => message.error(e.message) },
                    ),
                });
              }}
              onChangeStatus={(active) =>
                modal.confirm({
                  title: "Xác nhận",
                  content: active ? "Bạn có chắc chắn muốn mở kinh doanh cho hàng hóa này?" : "Bạn có chắc chắn muốn ngừng kinh doanh hàng hóa này?",
                  onOk: async () => {
                    try {
                      await updateStatus(record.id!, active);
                      message.success("Cập nhật trạng thái thành công");
                      refetch();
                    } catch (e: any) {
                      message.error(e?.message || "Lỗi cập nhật trạng thái");
                    }
                  },
                })
              }
            />
          ),
        }}
        />
      </div>

      <CreateNewProductDrawer open={openCreate} onClose={() => setOpenCreate(false)} />
      <UpdateProductDrawer open={openUpdate} onClose={() => setOpenUpdate(false)} productId={currentId ?? 0} />

      {contextHolder}
    </section>
  );
};

const ProductInformation = ({ record, onEdit, onDelete, onChangeStatus }: { record: ListProductResponse; onEdit: () => void; onDelete: () => void; onChangeStatus: (active: boolean) => void }) => {
  const isActive = !!record.isActive;
  const { data: detail } = useDetailProduct({ id: record.id! }, true);
  const d = detail?.data as DetailProductResponse | undefined;

  return (
    <div>
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Row gutter={16}>
            <Col span={10}>Mã hàng:</Col>
            <Col span={14}>{record.id}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={10}>Mã code:</Col>
            <Col span={14}>{record.code || "-"}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={10}>Tên hàng:</Col>
            <Col span={14}>{record.name}</Col>
          </Row>
        </Col>
        <Divider type="vertical" size="small" style={{ height: "auto" }} />
        <Col span={8}>
          <Row gutter={16}>
            <Col span={10}>Nhóm hàng:</Col>
            <Col span={14}>{record.category || "-"}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={10}>Loại thực đơn:</Col>
            <Col span={14}>{record.menuType || "-"}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={10}>Kinh doanh:</Col>
            <Col span={14}>
              <span className={`font-bold ${isActive ? "text-green-500" : "text-red-500"}`}>{isActive ? "Đang hoạt động" : "Ngừng hoạt động"}</span>
            </Col>
          </Row>
        </Col>
        <Divider type="vertical" size="small" style={{ height: "auto" }} />
        <Col span={8}>
          <Row gutter={16}>
            <Col span={10}>Giá vốn:</Col>
            <Col span={14}>{d?.costPrice ?? "-"}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={10}>Giá bán:</Col>
            <Col span={14}>{record.salePrice}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={10}>Tồn kho:</Col>
            <Col span={14}>{d?.stock ?? 0}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={10}>Ngưỡng tối thiểu / tối đa:</Col>
            <Col span={14}>{d ? `${d.minStock} / ${d.maxStock}` : "-"}</Col>
          </Row>
        </Col>
      </Row>

      {d?.images && d.images.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 font-semibold">Hình ảnh</div>
          <Image.PreviewGroup>
            {d.images.map((url, idx) => (
              <Image key={idx} src={url} width={96} height={96} style={{ objectFit: "cover", marginRight: 8, borderRadius: 6 }} />
            ))}
          </Image.PreviewGroup>
        </div>
      )}

      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
            Cập nhật hàng hóa
          </Button>
        </div>
        <div className="flex gap-2">
          <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
            Xóa hàng hóa
          </Button>
          {isActive ? (
            <Button danger icon={<StopOutlined />} onClick={() => onChangeStatus(false)}>
              Ngừng hoạt động
            </Button>
          ) : (
            <Button className="!bg-green-500 !text-white !border-green-500 hover:!bg-green-500 hover:!text-white hover:!border-green-500 focus:!shadow-none active:!bg-green-500" icon={<CheckOutlined />} onClick={() => onChangeStatus(true)}>
              Kinh doanh
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCategoryPage; 