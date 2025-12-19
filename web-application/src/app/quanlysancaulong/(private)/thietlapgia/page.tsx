"use client";

import {
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  TimePicker,
  message,
  Switch,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  StopOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
  useCreatePrice,
  useDeletePrice,
  useDetailPrice,
  useGetPriceTableProducts,
  useListPrices,
  useSetPriceTableProducts,
  useUpdatePrice,
} from "@/hooks/usePrices";
import {
  DetailPriceTableRequest,
  DetailPriceTableResponse,
  ListPriceTableRequest,
  ListPriceTableResponse,
  PriceTimeRangeDto,
  PriceTable,
  PriceTableProductItem,
  SetPriceTableProductsRequest,
  CreatePriceTableRequest,
  UpdatePriceTableRequest,
} from "@/types-openapi/api";
import { useListProducts } from "@/hooks/useProducts";
// import { ApiError } from "@/lib/axios"; // Unused
import React from "react";
import { useDetailProduct } from "@/hooks/useProducts";
import { axiosInstance as axios } from "@/lib/axios";
import { useListCategories } from "@/hooks/useCategories";

// Utility function to format currency
const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("vi-VN").format(value);
};

const columns = [
  { title: "Tên bảng giá", dataIndex: "name", key: "name" },
  {
    title: "Thời gian áp dụng",
    key: "range",
    render: (_: any, r: ListPriceTableResponse) => {
      if (!r.effectiveFrom && !r.effectiveTo) {
        return <span className="text-gray-500">Không giới hạn</span>;
      }
      const from = r.effectiveFrom ? dayjs(r.effectiveFrom).format("DD/MM/YYYY") : "Không giới hạn";
      const to = r.effectiveTo ? dayjs(r.effectiveTo).format("DD/MM/YYYY") : "Không giới hạn";
      return (
        <div>
          <div className="text-sm">
            <span className="font-medium">Từ:</span> {from}
          </div>
          <div className="text-sm">
            <span className="font-medium">Đến:</span> {to}
          </div>
        </div>
      );
    },
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    key: "isActive",
    render: (v: boolean) => (v ? <Tag color="green">Kích hoạt</Tag> : <Tag color="red">Chưa áp dụng</Tag>),
  },
];

const PriceManagementPage = () => {
  const [filters] = useState<ListPriceTableRequest>({}); // Remove setFilters if not used
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [searchForm] = Form.useForm<{ name?: string; range?: [Dayjs, Dayjs]; isActive?: boolean }>();
  const [searchValues, setSearchValues] = useState<{ name?: string; range?: [Dayjs, Dayjs]; isActive?: boolean }>({});

  const { data, isFetching, refetch } = useListPrices(filters);
  // const createMutation = useCreatePrice(); // Unused
  // const updateMutation = useUpdatePrice(); // Unused
  const deleteMutation = useDeletePrice();
  const [modal, contextHolder] = Modal.useModal();

  const onCreate = () => {
    setEditingId(null);
    setOpen(true);
  };
  const onEdit = (id: number) => {
    setEditingId(id);
    setOpen(true);
  };

  const filteredData = useMemo(() => {
    const listData = data?.data ?? [];
    const name = (searchValues.name || "").trim().toLowerCase();
    const range = searchValues.range;
    const isActive = searchValues.isActive;
    return listData.filter((x) => {
      const okName = !name || (x.name || "").toLowerCase().includes(name);
      const okStatus = isActive === undefined || x.isActive === isActive;
      if (!range || range.length !== 2) return okName && okStatus;
      const from = range[0]?.startOf("day");
      const to = range[1]?.endOf("day");
      const effFrom = x.effectiveFrom ? dayjs(x.effectiveFrom) : null;
      const effTo = x.effectiveTo ? dayjs(x.effectiveTo) : null;
      const overlap =
        (!effFrom || !to || effFrom.isBefore(to.add(1, "millisecond"))) && (!effTo || !from || effTo.isAfter(from.subtract(1, "millisecond")));
      return okName && okStatus && overlap;
    });
  }, [data?.data, searchValues]);

  const onSearchSubmit = (vals: any) => {
    setSearchValues(vals || {});
  };
  const onSearchReset = () => {
    searchForm.resetFields();
    setSearchValues({});
  };

  return (
    <section>
      <div className="mb-3">
        <Breadcrumb items={[{ title: "Quản lý hàng hoá" }, { title: "Thiết lập giá" }]} />
      </div>

      <Card
        className="mb-3"
        title="Lọc dữ liệu"
        extra={
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={() => searchForm.submit()}>
              Tìm kiếm
            </Button>
            <Button onClick={onSearchReset}>Reset</Button>
          </Space>
        }
      >
        <Form form={searchForm} layout="vertical" onFinish={onSearchSubmit}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="name" label="Tên bảng giá">
                <Input allowClear placeholder="Nhập tên" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="range" label="Hiệu lực từ ngày - đến">
                <DatePicker.RangePicker
                  style={{ width: "100%" }}
                  disabledDate={() => {
                    // disallow selecting past dates for end < start within UI filtering (loose)
                    return false;
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isActive" label="Trạng thái">
                <Select
                  allowClear
                  placeholder="Chọn trạng thái"
                  options={[
                    { value: true, label: "Kích hoạt" },
                    { value: false, label: "Không kích hoạt" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <div className="mt-4 mb-2 flex items-center justify-between">
        <div>
          <span className="font-bold text-green-500">Tổng số: {filteredData.length}</span>
        </div>
        <div className="flex gap-2">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Tải lại
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Thêm bảng giá
          </Button>
        </div>
      </div>

      <Table<ListPriceTableResponse>
        rowKey="id"
        columns={[...columns]}
        dataSource={filteredData}
        loading={isFetching}
        bordered
        expandable={{
          expandRowByClick: true,
          expandedRowRender: (record) => (
            <PriceInformation
              record={record}
              onEdit={() => onEdit(record.id!)}
              onDelete={() =>
                modal.confirm({
                  title: "Xác nhận",
                  content: `Xoá bảng giá ${record.name}?`,
                  onOk: () =>
                    deleteMutation.mutate(
                      { id: record.id! },
                      {
                        onSuccess: () => {
                          message.success("Đã xoá");
                          refetch();
                        },
                        onError: (error: any) => {
                          message.error(error?.message || "Không thể xóa bảng giá đang được kích hoạt");
                        },
                      },
                    ),
                })
              }
              onChangeStatus={(active) =>
                modal.confirm({
                  title: "Xác nhận",
                  content: active ? "Bạn muốn kích hoạt bảng giá này?" : "Bạn muốn ngừng áp dụng bảng giá này?",
                  onOk: async () => {
                    try {
                      await axios.put("/api/Prices/update-status", undefined, { params: { id: record.id!, isActive: active } });
                      message.success("Cập nhật trạng thái thành công");
                      refetch();
                    } catch (e: any) {
                      const errorMessage = e?.response?.data?.message || e?.message || "Lỗi cập nhật trạng thái";
                      message.error(errorMessage);
                    }
                  },
                })
              }
            />
          ),
        }}
      />

      {open && (
        <PriceDrawer
          open={open}
          onClose={() => setOpen(false)}
          priceId={editingId}
          onSaved={() => {
            setOpen(false);
            refetch();
          }}
        />
      )}

      {contextHolder}
    </section>
  );
};

const PriceInformation = ({
  record,
  onEdit,
  onDelete,
  onChangeStatus,
}: {
  record: ListPriceTableResponse;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (active: boolean) => void;
}) => {
  const { data } = useDetailPrice({ id: record.id! }, true);
  const d = data?.data as DetailPriceTableResponse | undefined;
  const { data: mapped } = useGetPriceTableProducts(record.id!, true);
  const priceTableProducts = mapped?.data?.products || [];
  const selectedIdToPrice = new Map<number, number | undefined>(
    priceTableProducts.map((product: any) => [product.productId, product.overrideSalePrice ?? undefined]),
  );
  const { data: allProducts } = useListProducts({} as any);
  const products = (allProducts?.data || []).filter((x) => selectedIdToPrice.has(x.id!));

  const CostCell = ({ productId }: { productId: number }) => {
    const { data: detail } = useDetailProduct({ id: productId }, true);
    const cost = (detail?.data as any)?.costPrice;
    return <span className="text-gray-600">{formatCurrency(cost)}</span>;
  };

  return (
    <div className="p-4">
      {/* Thông tin chung */}
      <Card className="mb-4" title={<span className="text-lg font-semibold">Thông tin bảng giá</span>}>
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <div className="space-y-1">
              <div className="text-sm text-gray-500">Tên bảng giá</div>
              <div className="text-base font-medium text-gray-900">{record.name}</div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <div className="space-y-1">
              <div className="text-sm text-gray-500">Trạng thái</div>
              <div>
                <Tag color={record.isActive ? "green" : "red"} className="px-2 py-1 text-sm">
                  {record.isActive ? "Kích hoạt" : "Không kích hoạt"}
                </Tag>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <div className="space-y-1">
              <div className="text-sm text-gray-500">Hiệu lực</div>
              <div className="text-base text-gray-900">
                {record.effectiveFrom || record.effectiveTo ? (
                  <span>
                    {record.effectiveFrom ? dayjs(record.effectiveFrom).format("DD/MM/YYYY") : "---"} -{" "}
                    {record.effectiveTo ? dayjs(record.effectiveTo).format("DD/MM/YYYY") : "---"}
                  </span>
                ) : (
                  <span className="text-gray-400">Không giới hạn</span>
                )}
              </div>
              {(record.effectiveFrom || record.effectiveTo) && (
                <div className="mt-1 text-xs text-gray-400">
                  {record.effectiveFrom ? dayjs(record.effectiveFrom).format("DD/MM/YYYY HH:mm") : "---"} →{" "}
                  {record.effectiveTo ? dayjs(record.effectiveTo).format("DD/MM/YYYY HH:mm") : "---"}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Khung giờ */}
      {d?.timeRanges && d.timeRanges.length > 0 && (
        <Card className="mb-4" title={<span className="text-lg font-semibold">Khung giờ áp dụng</span>}>
          <div className="flex flex-wrap gap-2">
            {d.timeRanges.map((it, idx) => (
              <Tag key={idx} color="blue" className="mb-2 px-3 py-1 text-sm">
                {it.startTime} - {it.endTime}
              </Tag>
            ))}
          </div>
        </Card>
      )}

      {/* Sản phẩm áp dụng */}
      <Card
        className="mb-4"
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Sản phẩm áp dụng</span>
            <Tag color="cyan" className="text-sm">
              {products.length} sản phẩm
            </Tag>
          </div>
        }
      >
        <div className="max-h-96 overflow-y-auto">
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={products}
            bordered
            columns={[
              {
                title: "Mã sản phẩm",
                dataIndex: "code",
                key: "code",
                width: 120,
                fixed: "left",
              },
              {
                title: "Tên hàng",
                dataIndex: "name",
                key: "name",
                width: 200,
                ellipsis: true,
              },
              {
                title: "Nhóm hàng",
                dataIndex: "category",
                key: "category",
                width: 150,
              },
              {
                title: "Giá vốn",
                key: "costPrice",
                width: 120,
                align: "right",
                render: (_: any, r: any) => <CostCell productId={r.id} />,
              },
              {
                title: "Giá áp dụng",
                key: "override",
                width: 150,
                align: "right",
                render: (_: any, r: any) => {
                  const price = selectedIdToPrice.get(r.id) ?? r.salePrice;
                  return <span className="font-semibold text-blue-600">{formatCurrency(price)} đ</span>;
                },
              },
            ]}
          />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2 border-t pt-4">
        {record.isActive ? (
          <Button danger icon={<StopOutlined />} onClick={() => onChangeStatus(false)}>
            Ngừng áp dụng
          </Button>
        ) : (
          <Button
            className="!border-green-500 !bg-green-500 !text-white hover:!border-green-500 hover:!bg-green-500 hover:!text-white focus:!shadow-none active:!bg-green-500"
            icon={<CheckOutlined />}
            onClick={() => onChangeStatus(true)}
          >
            Kích hoạt
          </Button>
        )}
        <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
          Sửa bảng giá
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
          Xoá
        </Button>
      </div>
    </div>
  );
};

const PriceDrawer = ({ open, onClose, priceId, onSaved }: { open: boolean; onClose: () => void; priceId: number | null; onSaved: () => void }) => {
  const [activeTab, setActiveTab] = useState<string>("info");
  const [form] = Form.useForm<
    PriceTable & {
      ranges: PriceTimeRangeDto[];
      months?: number[];
      daysOfMonth?: number[];
      weekdays?: number[];
      effective?: [Dayjs, Dayjs];
    }
  >();
  const isCreate = !priceId;

  const { data } = useDetailPrice({ id: priceId || 0 } as DetailPriceTableRequest, !!priceId);
  const createMutation = useCreatePrice();
  const updateMutation = useUpdatePrice();

  const { data: productIdsRes } = useGetPriceTableProducts(priceId || 0, !!priceId);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productsRowsState, setProductsRowsState] = useState<Record<number, number | undefined>>({});
  const { data: allProductsForCreate } = useListProducts({} as any);

  useEffect(() => {
    if (data?.data && open) {
      const d = data.data;
      form.setFieldsValue({
        id: d.id,
        name: d.name,
        isActive: d.isActive,
        effectiveFrom: d.effectiveFrom,
        effectiveTo: d.effectiveTo,
        effective: [d.effectiveFrom ? dayjs(d.effectiveFrom) : undefined, d.effectiveTo ? dayjs(d.effectiveTo) : undefined] as any,
        ranges: (d.timeRanges || []).map((r) => ({
          id: r.id,
          startTime: r.startTime ? dayjs(r.startTime, "HH:mm:ss") : undefined,
          endTime: r.endTime ? dayjs(r.endTime, "HH:mm:ss") : undefined,
        })),
      } as any);
    }
  }, [data?.data, open, form]);

  useEffect(() => {
    if (productIdsRes?.data && open && !isCreate) {
      // Chỉ load sản phẩm khi đang edit, không load khi tạo mới
      const productIds = productIdsRes.data.products?.map((p) => p.productId) || [];
      setSelectedProductIds(productIds);
    } else if (isCreate && open) {
      // Reset khi tạo mới
      setSelectedProductIds([]);
      setProductsRowsState({});
    }
  }, [productIdsRes?.data, open, isCreate]);

  const onSubmit = (values: any) => {
    const cleanRanges = (values.ranges || [])
      .map((r: any) => ({
        id: r?.id || null,
        startTime: r?.startTime ? dayjs(r.startTime).format("HH:mm:ss") : undefined,
        endTime: r?.endTime ? dayjs(r.endTime).format("HH:mm:ss") : undefined,
      }))
      .filter((r: any) => !!r.startTime && !!r.endTime);

    if (isCreate) {
      // Lấy products từ ProductsSelector
      const products: PriceTableProductItem[] = selectedProductIds.map((id) => {
        const value = productsRowsState[id];
        return { productId: id, overrideSalePrice: value };
      });

      // Validation: yêu cầu ít nhất 1 sản phẩm
      if (products.length === 0) {
        message.error("Vui lòng chọn ít nhất 1 sản phẩm để tạo bảng giá");
        setActiveTab("scope");
        return;
      }

      const payload: CreatePriceTableRequest = {
        name: values.name,
        isActive: !!values.isActive,
        effectiveFrom: values.effective?.[0]?.toDate?.(),
        effectiveTo: values.effective?.[1]?.toDate?.(),
        timeRanges: cleanRanges,
        products: products.length > 0 ? products : undefined,
      };

      createMutation.mutate(payload, {
        onSuccess: () => {
          message.success("Tạo bảng giá thành công");
          setProductsRowsState({});
          setSelectedProductIds([]);
          onSaved();
        },
        onError: (e: any) => message.error(e?.message || "Lỗi tạo bảng giá"),
      });
    } else {
      // Validation: yêu cầu ít nhất 1 sản phẩm khi update
      const products: PriceTableProductItem[] = selectedProductIds.map((id) => {
        const value = productsRowsState[id];
        return { productId: id, overrideSalePrice: value };
      });

      if (products.length === 0) {
        message.error("Vui lòng chọn ít nhất 1 sản phẩm để cập nhật bảng giá");
        setActiveTab("scope");
        return;
      }

      const payload: UpdatePriceTableRequest = {
        id: priceId!,
        name: values.name,
        isActive: !!values.isActive,
        effectiveFrom: values.effective?.[0]?.toDate?.(),
        effectiveTo: values.effective?.[1]?.toDate?.(),
        timeRanges: cleanRanges,
      };

      updateMutation.mutate(payload, {
        onSuccess: async () => {
          // Sau khi update thông tin bảng giá thành công, update sản phẩm
          try {
            // Luôn gọi API set-products với danh sách sản phẩm đã được validate
            const productsPayload: SetPriceTableProductsRequest = {
              priceTableId: priceId!,
              products: products,
            };

            await axios.post("/api/Prices/set-products", productsPayload);

            message.success("Cập nhật bảng giá và sản phẩm thành công");
            setProductsRowsState({});
            setSelectedProductIds([]);
            onSaved();
          } catch (error: any) {
            message.error(error?.response?.data?.message || error?.message || "Lỗi cập nhật sản phẩm");
          }
        },
        onError: (e: any) => message.error(e?.message || "Lỗi cập nhật bảng giá"),
      });
    }
  };

  return (
    <Drawer width={900} open={open} onClose={onClose} destroyOnClose title={isCreate ? "Thêm bảng giá" : "Cập nhật bảng giá"}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "info",
            label: "Thông tin",
            children: (
              <Form layout="vertical" form={form} onFinish={onSubmit}>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      label="Tên bảng giá"
                      rules={[
                        { required: true, message: "Nhập tên" },
                        {
                          validator: async (_r, v) => {
                            if (!v) return Promise.resolve();
                            const res = await axios.get("/api/Prices/list", { params: { name: v } });
                            const arr = (res.data?.data || []) as any[];
                            const dup = arr.some((x: any) => (x.name || "").toLowerCase() === String(v).toLowerCase() && x.id !== priceId);
                            if (dup) return Promise.reject(new Error("Tên bảng giá đã tồn tại"));
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="effective"
                      label="Hiệu lực từ ngày - đến"
                      rules={[
                        {
                          validator: (_: any, v: [Dayjs, Dayjs]) => {
                            if (!v || v.length !== 2 || !v[0] || !v[1]) return Promise.resolve();
                            if (v[1].isBefore(v[0])) return Promise.reject(new Error("Ngày kết thúc không được trước ngày bắt đầu"));
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <DatePicker.RangePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="isActive" label="Trạng thái">
                      <Switch checkedChildren="Kinh doanh" unCheckedChildren="Không kinh doanh" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.List name="ranges">
                  {(fields, { add, remove }) => {
                    const validateTimeRange = (fieldIndex: number, startTime: Dayjs | undefined, endTime: Dayjs | undefined) => {
                      if (!startTime || !endTime) return true;
                      // Kiểm tra startTime phải trước endTime
                      if (startTime.isAfter(endTime) || startTime.isSame(endTime)) {
                        return false;
                      }
                      // Kiểm tra trùng với các khung giờ khác
                      const currentRanges = form.getFieldValue("ranges") || [];
                      for (let i = 0; i < currentRanges.length; i++) {
                        if (i === fieldIndex) continue;
                        const otherStart = currentRanges[i]?.startTime;
                        const otherEnd = currentRanges[i]?.endTime;
                        if (!otherStart || !otherEnd) continue;
                        // Kiểm tra overlap: (startTime < otherEnd) && (endTime > otherStart)
                        if (startTime.isBefore(otherEnd) && endTime.isAfter(otherStart)) {
                          return false;
                        }
                      }
                      return true;
                    };

                    // Validate tất cả các field khi có thay đổi
                    const validateAllRanges = () => {
                      const ranges = form.getFieldValue("ranges") || [];
                      ranges.forEach((_: any, index: number) => {
                        const startTime = ranges[index]?.startTime;
                        const endTime = ranges[index]?.endTime;
                        if (startTime && endTime) {
                          form.validateFields([["ranges", index, "startTime"], ["ranges", index, "endTime"]]);
                        }
                      });
                    };

                    return (
                      <Card
                        title="Khung giờ"
                        extra={
                          <Button
                            onClick={() => {
                              add({ startTime: dayjs("08:00", "HH:mm"), endTime: dayjs("12:00", "HH:mm") });
                              // Validate sau khi thêm
                              setTimeout(validateAllRanges, 100);
                            }}
                            icon={<PlusOutlined />}
                          >
                            Thêm khung giờ
                          </Button>
                        }
                      >
                        {fields.map((field) => (
                          <Row key={field.key} gutter={12} align="middle" className="mb-2">
                            <Col span={7}>
                              <Form.Item
                                name={[field.name, "startTime"]}
                                label="Từ giờ"
                                rules={[
                                  { required: true, message: "Chọn giờ bắt đầu" },
                                  {
                                    validator: (_, value) => {
                                      const ranges = form.getFieldValue("ranges") || [];
                                      const endTime = ranges[field.name]?.endTime;
                                      if (!value) return Promise.resolve();
                                      if (endTime && (value.isAfter(endTime) || value.isSame(endTime))) {
                                        return Promise.reject(new Error("Giờ bắt đầu phải trước giờ kết thúc"));
                                      }
                                      if (!validateTimeRange(field.name, value, endTime)) {
                                        return Promise.reject(new Error("Khung giờ bị trùng với khung giờ khác"));
                                      }
                                      // Validate lại các field khác
                                      setTimeout(validateAllRanges, 100);
                                      return Promise.resolve();
                                    },
                                  },
                                ]}
                                dependencies={[["ranges"]]}
                              >
                                <TimePicker format="HH:mm" style={{ width: "100%" }} />
                              </Form.Item>
                            </Col>
                            <Col span={7}>
                              <Form.Item
                                name={[field.name, "endTime"]}
                                label="Đến"
                                rules={[
                                  { required: true, message: "Chọn giờ kết thúc" },
                                  {
                                    validator: (_, value) => {
                                      const ranges = form.getFieldValue("ranges") || [];
                                      const startTime = ranges[field.name]?.startTime;
                                      if (!value) return Promise.resolve();
                                      if (startTime && (startTime.isAfter(value) || startTime.isSame(value))) {
                                        return Promise.reject(new Error("Giờ kết thúc phải sau giờ bắt đầu"));
                                      }
                                      if (!validateTimeRange(field.name, startTime, value)) {
                                        return Promise.reject(new Error("Khung giờ bị trùng với khung giờ khác"));
                                      }
                                      // Validate lại các field khác
                                      setTimeout(validateAllRanges, 100);
                                      return Promise.resolve();
                                    },
                                  },
                                ]}
                                dependencies={[["ranges"]]}
                              >
                                <TimePicker format="HH:mm" style={{ width: "100%" }} />
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Button
                                danger
                                onClick={() => {
                                  remove(field.name);
                                  // Validate lại sau khi xóa
                                  setTimeout(validateAllRanges, 100);
                                }}
                              >
                                Xoá
                              </Button>
                            </Col>
                          </Row>
                        ))}
                      </Card>
                    );
                  }}
                </Form.List>

                <div className="mt-3 text-right">
                  <Space>
                    <Button onClick={onClose}>Đóng</Button>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                      Lưu
                    </Button>
                  </Space>
                </div>
              </Form>
            ),
          },
          {
            key: "scope",
            label: "Phạm vi áp dụng",
            children: (
              <ProductsSelector
                priceId={priceId}
                selected={selectedProductIds}
                onChangeSelected={setSelectedProductIds}
                isCreate={isCreate}
                rowsState={productsRowsState}
                onRowsStateChange={setProductsRowsState}
              />
            ),
          },
        ]}
      />
    </Drawer>
  );
};

const ProductsSelector = ({
  priceId,
  selected,
  onChangeSelected,
  isCreate = false,
  rowsState: externalRowsState,
  onRowsStateChange,
}: {
  priceId: number | null;
  selected: number[];
  onChangeSelected: (v: number[]) => void;
  isCreate?: boolean;
  rowsState?: Record<number, number | undefined>;
  onRowsStateChange?: (state: Record<number, number | undefined>) => void;
}) => {
  const [params, setParams] = useState<any>({});
  const [form] = Form.useForm<any>();
  const { data: productsRes, isFetching } = useListProducts(params);
  const { data: mapped } = useGetPriceTableProducts(priceId || 0, !!priceId);
  const [internalRowsState, setInternalRowsState] = useState<Record<number, number | undefined>>({});
  const rowsState = externalRowsState ?? internalRowsState;
  const setRowsState = onRowsStateChange
    ? (state: Record<number, number | undefined> | ((prev: Record<number, number | undefined>) => Record<number, number | undefined>)) => {
        if (typeof state === "function") {
          const newState = state(rowsState);
          onRowsStateChange(newState);
        } else {
          onRowsStateChange(state);
        }
      }
    : setInternalRowsState;
  const setProducts = useSetPriceTableProducts();
  const { data: categoriesRes } = useListCategories({});

  const rows = productsRes?.data ?? [];
  const CostCell = ({ productId }: { productId: number }) => {
    const { data: detail } = useDetailProduct({ id: productId }, true);
    const cost = (detail?.data as any)?.costPrice;
    return <>{formatCurrency(cost)}</>;
  };

  useEffect(() => {
    if (mapped?.data && priceId && !isCreate) {
      // Chỉ load sản phẩm khi đang edit, không load khi tạo mới
      const initial: Record<number, number | undefined> = {};
      const products = mapped.data.products || [];
      products.forEach((product: any) => {
        initial[product.productId] = product.overrideSalePrice ?? undefined;
      });
      setRowsState(initial);
      onChangeSelected(products.map((p: any) => p.productId));
    } else if (isCreate) {
      // Reset khi tạo mới
      setRowsState({});
      onChangeSelected([]);
    }
  }, [mapped?.data, priceId, onChangeSelected, isCreate]);

  const rowSelection = {
    selectedRowKeys: selected,
    onChange: (keys: React.Key[], selectedRows: any[]) => {
      // Cho phép chọn cả sản phẩm ngừng kinh doanh
      const allKeys = selectedRows.map((r) => r.id as number);
      onChangeSelected(allKeys);
    },
    getCheckboxProps: (record: any) => ({ disabled: false }),
  } as any;

  const onSearch = (v: any) => {
    // Map categoryId to category name
    const selectedCategory = categoriesRes?.data?.find((cat: any) => cat.id === v.categoryId);
    const categoryName = selectedCategory?.name;

    setParams({
      code: v.code || undefined,
      name: v.name || undefined,
      category: categoryName || undefined,
      isActive: typeof v.isActive === "boolean" ? v.isActive : undefined,
    });
  };

  const onReset = () => {
    form.resetFields();
    setParams({});
  };

  const onSave = () => {
    if (!priceId && !isCreate) return;

    // Cho phép lưu cả sản phẩm ngừng kinh doanh
    if (priceId) {
      const products: PriceTableProductItem[] = selected.map((id) => {
        const row = rows.find((r: any) => r.id === id);
        const value = rowsState[id] ?? row?.salePrice;
        return { productId: id, overrideSalePrice: value };
      });

      const payload: SetPriceTableProductsRequest = {
        priceTableId: priceId,
        products: products,
      };

      setProducts.mutate(payload, {
        onSuccess: () => message.success("Đã lưu sản phẩm áp dụng"),
        onError: (e: any) => message.error(e?.message || "Lỗi lưu sản phẩm"),
      });
    } else {
      message.success("Sản phẩm đã được chọn, vui lòng lưu bảng giá");
    }
  };

  return (
    <Card
      title="Chọn sản phẩm áp dụng"
      extra={
        <Space>
          <Button onClick={onReset}>Reset</Button>
          <Button icon={<SearchOutlined />} type="primary" onClick={() => form.submit()}>
            Tìm kiếm
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={onSearch} className="mb-3">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="code" label="Mã code">
              <Input placeholder="Nhập mã" allowClear />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="name" label="Tên hàng">
              <Input placeholder="Nhập tên" allowClear />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="categoryId" label="Nhóm hàng">
              <Select
                allowClear
                placeholder="Chọn nhóm hàng"
                options={
                  categoriesRes?.data?.map((cat: any) => ({
                    value: cat.id,
                    label: cat.name,
                  })) || []
                }
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="isActive" label="Trạng thái">
              <Select
                allowClear
                placeholder="Chọn trạng thái"
                options={[
                  { value: true, label: "Kích hoạt" },
                  { value: false, label: "Không kích hoạt" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <div className="max-h-96 overflow-y-auto">
        <Table
          rowKey="id"
          dataSource={rows}
          loading={isFetching}
          rowSelection={rowSelection as any}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
          columns={[
            { title: "Mã", dataIndex: "code" },
            { title: "Tên hàng", dataIndex: "name" },
            { title: "Nhóm", dataIndex: "category" },
            { title: "Giá vốn", key: "costPrice", render: (_: any, r: any) => <CostCell productId={r.id} /> },
            {
              title: "Giá áp dụng",
              key: "overrideSalePrice",
              render: (_: any, r: any) => {
                const CostCellForValidation = ({ productId, currentPrice }: { productId: number; currentPrice: number | undefined }) => {
                  const { data: detail } = useDetailProduct({ id: productId }, true);
                  const costPrice = (detail?.data as any)?.costPrice ?? 0;
                  // Hiển thị giá từ rowsState, nếu không có thì hiển thị placeholder cho cả add và edit
                  const displayValue = currentPrice;
                  return (
                    <InputNumber
                      min={costPrice}
                      style={{ width: 140 }}
                      value={displayValue}
                      placeholder="Nhập giá"
                      onChange={async (val) => {
                        const newPrice = val as number | null;
                        if (newPrice !== null && newPrice < costPrice) {
                          message.error(`Giá áp dụng phải lớn hơn hoặc bằng giá vốn (${formatCurrency(costPrice)})`);
                          return;
                        }
                        setRowsState((s) => ({ ...s, [r.id]: newPrice ?? undefined }));
                      }}
                      formatter={(value) => (value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
                      parser={(value) => (value ? value.replace(/\$\s?|(,*)/g, "") : "")}
                    />
                  );
                };
                return <CostCellForValidation productId={r.id} currentPrice={rowsState[r.id]} />;
              },
            },
            {
              title: "Trạng thái",
              dataIndex: "isActive",
              render: (v: boolean) => (v ? <Tag color="green">Kích hoạt</Tag> : <Tag color="red">Không kích hoạt</Tag>),
            },
          ]}
        />
      </div>

      <div className="mt-4 text-right">
        <div className="text-sm text-gray-500">
          Sản phẩm đã chọn sẽ được lưu cùng với bảng giá khi bạn nhấn &quot;Lưu&quot; ở tab &quot;Thông tin&quot;
        </div>
      </div>
    </Card>
  );
};

export default PriceManagementPage;
