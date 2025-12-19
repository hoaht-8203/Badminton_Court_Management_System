"use client";

import CreateNewProductDrawer from "@/components/quanlysancaulong/products/create-new-product-drawer";
import CreateWebProductDrawer from "@/components/quanlysancaulong/products/create-web-product-drawer";
import { productColumns, StockCell, StockSummaryCell } from "@/components/quanlysancaulong/products/products-columns";
import SearchProducts from "@/components/quanlysancaulong/products/search-products";
import UpdateProductDrawer from "@/components/quanlysancaulong/products/update-product-drawer";
import { useDeleteProduct, /* useUpdateProduct, */ useDetailProduct, useListProducts } from "@/hooks/useProducts";
import { ApiError, apiBaseUrl, axiosInstance } from "@/lib/axios";
import { DetailProductResponse, ListProductRequest, ListProductResponse } from "@/types-openapi/api";
import { CheckOutlined, EditOutlined, PlusOutlined, ReloadOutlined, StopOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Col, Divider, Image, message, Modal, Row, Table, TableProps, Tabs, Tag } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { HubConnection, HubConnectionBuilder, HttpTransportType, ILogger, LogLevel } from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

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
  const [openCreateWeb, setOpenCreateWeb] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [modal, contextHolder] = Modal.useModal();

  const { data, isFetching, refetch } = useListProducts(searchParams);
  const deleteMutation = useDeleteProduct();
  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null);
  const { user } = useAuth();
  const [stockRefreshTrigger, setStockRefreshTrigger] = useState(0);
  // const updateMutation = useUpdateProduct(); // Unused - comment out

  // SignalR connection for realtime product stock updates
  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      return;
    }

    const filteredLogger: ILogger = {
      log: (level, message) => {
        const text = String(message ?? "");
        if (text.includes("stopped during negotiation") || text.includes("before stop() was called")) {
          return;
        }
        if (level >= LogLevel.Error) {
          console.error(`[SignalR Product] ${text}`);
        } else if (level >= LogLevel.Warning) {
          console.warn(`[SignalR Product] ${text}`);
        } else if (level >= LogLevel.Information) {
          console.info(`[SignalR Product] ${text}`);
        }
      },
    };

    const conn = new HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/hubs/products`, {
        withCredentials: true,
        skipNegotiation: false,
        transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.elapsedMilliseconds < 60000) {
            // If we've been reconnecting for less than 60 seconds, wait 2 seconds before retrying
            return 2000;
          } else {
            // If we've been reconnecting for more than 60 seconds, wait 5 seconds before retrying
            return 5000;
          }
        },
      })
      .configureLogging(filteredLogger)
      .build();

    connectionRef.current = conn;

    // Listen for product stock updates
    conn.on("productStockUpdated", async (productIds: number[]) => {
      console.log("[SignalR Product] Received productStockUpdated event for product IDs:", productIds);
      try {
        // Invalidate all product list queries
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && key.length > 0 && key[0] === "products";
          },
        });
        // Invalidate all product detail queries (for StockCell components)
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && key.length > 0 && key[0] === "product";
          },
        });
        // Trigger refresh for StockSummaryCell components
        setStockRefreshTrigger((prev) => prev + 1);
        // Force refetch immediately with current search params
        const result = await refetch();
        console.log("[SignalR Product] Successfully refetched products after stock update", result);
      } catch (error) {
        console.error("[SignalR Product] Error refetching products:", error);
      }
    });

    let isAlive = true;
    const startConnection = async () => {
      try {
        await conn.start();
        if (isAlive) {
          console.log("[SignalR Product] Connected to ProductHub successfully");
        }
      } catch (err) {
        if (isAlive) {
          console.error("[SignalR Product] Connection error:", err);
        }
      }
    };

    startConnection();

    // Handle reconnection
    conn.onreconnecting(() => {
      console.log("[SignalR Product] Reconnecting...");
    });

    conn.onreconnected(() => {
      console.log("[SignalR Product] Reconnected successfully");
    });

    conn.onclose((error) => {
      if (error) {
        console.error("[SignalR Product] Connection closed with error:", error);
      } else {
        console.log("[SignalR Product] Connection closed");
      }
    });

    return () => {
      isAlive = false;
      if (conn.state !== "Disconnected") {
        conn.stop().catch(() => {});
      }
    };
  }, [queryClient, user, refetch]);

  // Auto refetch when tab becomes visible (user switches back to this tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refetch]);

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

    // Thêm hàng tổng kết ở đầu
    const summaryRow = {
      id: -1, // ID đặc biệt để phân biệt
      code: "",
      name: "",
      category: "",
      salePrice: null,
      isActive: null,
      isSummaryRow: true, // Flag để nhận biết đây là hàng tổng kết
    };

    return [summaryRow, ...arr];
  }, [data?.data, searchParams.isActive, searchParams.priceSort]);

  const updateStatus = async (id: number, isActive: boolean) => {
    await axiosInstance.put("/api/Products/update-status", undefined, { params: { id, isActive } });
  };

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb
          items={[
            { title: <Link href="/homepage">Trang chủ</Link> },
            { title: "Quản lý hàng hoá" },
            { title: "Quản lý danh mục" },
          ]}
        />
      </div>

      <div className="mb-2">
        <SearchProducts onSearch={setSearchParams} onReset={() => setSearchParams({})} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số hàng hóa: {tableData.filter((item) => !(item as any).isSummaryRow).length}</span>
          </div>
          <div className="flex gap-2">
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              Tải lại
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => setOpenCreate(true)}>
              Thêm hàng hóa
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreateWeb(true)}>
              Thêm sản phẩm bán hàng
            </Button>
          </div>
        </div>

        <Table<ListProductResponse>
          {...tableProps}
          columns={productColumns?.map((col) => {
            if (col.key === "stock") {
              return {
                ...col,
                render: (_, record) => {
                  if ((record as any).isSummaryRow) {
                    return <StockSummaryCell productIds={tableData.filter((item) => !(item as any).isSummaryRow).map((item) => item.id!)} refreshTrigger={stockRefreshTrigger} />;
                  }
                  return <StockCell productId={record.id!} />;
                },
              };
            }
            return col;
          })}
          dataSource={tableData as any}
          loading={isFetching}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => {
              // Không hiển thị chi tiết cho hàng tổng kết
              if ((record as any).isSummaryRow) return null;

              return (
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
              );
            },
          }}
        />
      </div>

      <CreateNewProductDrawer open={openCreate} onClose={() => setOpenCreate(false)} />
      <CreateWebProductDrawer open={openCreateWeb} onClose={() => setOpenCreateWeb(false)} />
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
      <Tabs
        defaultActiveKey="info"
        items={[
          {
            key: "info",
            label: "Thông tin",
            children: (
              <div>
                <Row gutter={16} className="mb-4">
                  <Col span={18}>
                    <Row gutter={[16, 0]}>
                      <Col span={8}>
                        <div>
                          <div className="flex">
                            <div className="w-32 font-medium">Mã hàng:</div>
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
                            <div className="w-32 font-medium">Kinh doanh:</div>
                            <div>
                              <Tag color={isActive ? "green" : "red"}>{isActive ? "Kinh doanh" : "Ngừng kinh doanh"}</Tag>
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
                            <div>{d ? `${d.minStock ?? 0} / ${d.maxStock ?? 0}` : "0 / 0"}</div>
                          </div>
                          <Divider size="small" style={{ margin: "4px 0" }} />

                          <div className="flex">
                            <div className="w-32 font-medium">Mô tả:</div>
                            <div
                              className="max-h-32 flex-1 overflow-y-auto rounded border border-gray-200 px-2 py-1 text-sm"
                              style={{ minHeight: "32px" }}
                            >
                              {d?.description || ""}
                            </div>
                          </div>
                          <Divider size="small" style={{ margin: "4px 0" }} />

                          <div className="flex">
                            <div className="w-32 font-medium">Ghi chú:</div>
                            <div
                              className="max-h-32 flex-1 overflow-y-auto rounded border border-gray-200 px-2 py-1 text-sm"
                              style={{ minHeight: "32px" }}
                            >
                              {"" /* Ghi chú field 'note' không tồn tại trên kiểu DetailProductResponse */}
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Col>

                  <Col span={6} className="flex flex-col items-center">
                    {d?.images && d.images.length > 0 && (
                      <div className="w-full">
                        <div className="mb-3 text-center font-semibold">Hình ảnh</div>
                        <div className="flex justify-center">
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
                    {isActive ? (
                      <Button danger icon={<StopOutlined />} onClick={() => onChangeStatus(false)}>
                        Ngừng kinh doanh
                      </Button>
                    ) : (
                      <Button
                        className="!border-green-500 !bg-green-500 !text-white hover:!border-green-500 hover:!bg-green-500 hover:!text-white focus:!shadow-none active:!bg-green-500"
                        icon={<CheckOutlined />}
                        onClick={() => onChangeStatus(true)}
                      >
                        Mở kinh doanh
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "cards",
            label: "Thẻ kho",
            children: <ProductInventoryCards productId={record.id!} />,
          },
        ]}
      />
    </div>
  );
};

const ProductInventoryCards = ({ productId }: { productId: number }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const svc = await import("@/services/inventoryService");
        const res: any = await svc.inventoryService.listCardsByProduct(productId);
        setData(res?.data || []);
      } catch (error: any) {
        // If product has no inventory cards yet, treat as empty list (not an error)
        if (error?.message?.includes("Không tìm thấy") || error?.status === 404) {
          setData([]);
        } else {
          // Only log actual unexpected errors
          console.error("Error loading inventory cards:", error);
          setData([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  return (
    <div className="max-h-96 overflow-y-auto">
      <Table
        size="small"
        rowKey={(r) => `${r.code}-${r.occurredAt}`}
        loading={loading}
        dataSource={data}
        pagination={false}
        scroll={{ x: 800 }}
        bordered
        locale={{
          emptyText: (
            <div className="py-8 text-center text-gray-500">
              <div className="mb-2 text-4xl">📋</div>
              <div>Chưa có thẻ kho nào</div>
              <div className="text-sm">Thẻ kho sẽ được tạo tự động khi có giao dịch tồn kho</div>
            </div>
          ),
        }}
        columns={[
          {
            title: "Chứng từ",
            dataIndex: "code",
            key: "code",
            width: 120,
            fixed: "left",
          },
          {
            title: "Phương thức",
            dataIndex: "method",
            key: "method",
            width: 160,
            ellipsis: true,
          },
          {
            title: "Thời gian",
            dataIndex: "occurredAt",
            key: "occurredAt",
            width: 160,
            render: (d: any) => (d ? new Date(d).toLocaleString("vi-VN") : "-"),
          },
          {
            title: "Giá vốn",
            dataIndex: "costPrice",
            key: "costPrice",
            width: 120,
            align: "right",
            render: (v: any) => (Number(v) || 0).toLocaleString("vi-VN") + " đ",
          },
          {
            title: "Số lượng",
            dataIndex: "quantityChange",
            key: "quantityChange",
            width: 100,
            align: "right",
            render: (v: any) => {
              const num = Number(v) || 0;
              return (
                <span className={num > 0 ? "text-green-600" : num < 0 ? "text-red-600" : ""}>
                  {num > 0 ? "+" : ""}
                  {num.toLocaleString("vi-VN")}
                </span>
              );
            },
          },
          {
            title: "Tồn cuối",
            dataIndex: "endingStock",
            key: "endingStock",
            width: 100,
            align: "right",
            render: (v: any) => (Number(v) || 0).toLocaleString("vi-VN"),
          },
        ]}
      />
    </div>
  );
};

export default ProductCategoryPage;
