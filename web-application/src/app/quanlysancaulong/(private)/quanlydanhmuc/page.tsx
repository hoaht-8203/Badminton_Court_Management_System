"use client";

import { useDeleteProduct, useListProducts, /* useUpdateProduct, */ useDetailProduct } from "@/hooks/useProducts";
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
  // const updateMutation = useUpdateProduct(); // Unused - comment out

  const tableData = useMemo(() => {
    let arr = [...(data?.data ?? [])];
    if (typeof searchParams.isActive === "boolean") {
      arr = arr.filter((x) => !!x.isActive === searchParams.isActive);
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
                    content: active
                      ? "Bạn có chắc chắn muốn mở kinh doanh cho hàng hóa này?"
                      : "Bạn có chắc chắn muốn ngừng kinh doanh hàng hóa này?",
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

const ProductInformation = ({
  record,
  onEdit,
  onDelete,
  onChangeStatus,
}: {
  record: ListProductResponse;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (active: boolean) => void;
}) => {
  const isActive = !!record.isActive;
  const { data: detail } = useDetailProduct({ id: record.id! }, true);
  const d = detail?.data as DetailProductResponse | undefined;

  return (
    <div>
      <Row gutter={16} className="mb-4">
        <Col span={18}>
          <Row gutter={[16, 0]}>
            <Col span={8}>
              <div>
                <div className="flex">
                  <div className="w-32 font-medium">Mã hàng:</div>
                  <div>{record.id}</div>
                </div>
                <Divider size="small" style={{ margin: "4px 0" }} />

                <div className="flex">
                  <div className="w-32 font-medium">Mã code:</div>
                  <div>{record.code || "-"}</div>
                </div>
                <Divider size="small" style={{ margin: "4px 0" }} />

                <div className="flex">
                  <div className="w-32 font-medium">Tên hàng:</div>
                  <div>{record.name}</div>
                </div>
                <Divider size="small" style={{ margin: "4px 0" }} />
              </div>
            </Col>

            <Col span={8}>
              <div>
                <div className="flex">
                  <div className="w-32 font-medium">Nhóm hàng:</div>
                  <div>{record.category || "-"}</div>
                </div>
                <Divider size="small" style={{ margin: "4px 0" }} />

                <div className="flex">
                  <div className="w-32 font-medium">Loại thực đơn:</div>
                  <div>{record.menuType || "-"}</div>
                </div>
                <Divider size="small" style={{ margin: "4px 0" }} />

                <div className="flex">
                  <div className="w-32 font-medium">Kinh doanh:</div>
                  <div>
                    <span className={`font-bold ${isActive ? "text-green-500" : "text-red-500"}`}>
                      {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                    </span>
                  </div>
                </div>
                <Divider size="small" style={{ margin: "4px 0" }} />
              </div>
            </Col>

            <Col span={8}>
              <div>
                <div className="flex">
                  <div className="w-32 font-medium">Giá vốn:</div>
                  <div>{d?.costPrice ?? "-"}</div>
                </div>
                <Divider size="small" style={{ margin: "4px 0" }} />

                <div className="flex">
                  <div className="w-32 font-medium">Giá bán:</div>
                  <div>{record.salePrice}</div>
                </div>
                <Divider size="small" style={{ margin: "4px 0" }} />

                <div className="flex">
                  <div className="w-32 font-medium">Tồn kho:</div>
                  <div>{d?.stock ?? 0}</div>
                </div>
                <Divider size="small" style={{ margin: "4px 0" }} />

                <div className="flex">
                  <div className="w-32 font-medium">Ngưỡng min/max:</div>
                  <div>{d ? `${d.minStock} / ${d.maxStock}` : "-"}</div>
                </div>
              </div>
            </Col>
          </Row>
        </Col>

        <Col span={6} className="flex items-start justify-end">
          {d?.images && d.images.length > 0 && (
            <div>
              <div className="mb-2 text-center font-semibold">Hình ảnh</div>
              <Image.PreviewGroup>
                <Image src={d.images[0]} alt="Product image" width={180} height={180} style={{ objectFit: "contain", borderRadius: 8 }} />
                {d.images.length > 1 && (
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {d.images.slice(1).map((url, idx) => (
                      <Image
                        key={idx}
                        src={url}
                        alt={`Product image ${idx + 2}`}
                        width={60}
                        height={60}
                        style={{ objectFit: "cover", borderRadius: 6 }}
                      />
                    ))}
                  </div>
                )}
              </Image.PreviewGroup>
            </div>
          )}
        </Col>
      </Row>

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
            <Button
              className="!border-green-500 !bg-green-500 !text-white hover:!border-green-500 hover:!bg-green-500 hover:!text-white focus:!shadow-none active:!bg-green-500"
              icon={<CheckOutlined />}
              onClick={() => onChangeStatus(true)}
            >
              Kinh doanh
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCategoryPage;
