"use client";

import { Breadcrumb, Button, Card, Col, DatePicker, Drawer, Form, Input, InputNumber, List, Modal, Row, Select, Space, Table, Tabs, Tag, TimePicker, message, Switch } from "antd";
import { PlusOutlined, ReloadOutlined, SaveOutlined, SearchOutlined, EditOutlined, DeleteOutlined, CheckOutlined, StopOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useCreatePrice, useDeletePrice, useDetailPrice, useGetPriceTableProducts, useListPrices, useSetPriceTableProducts, useUpdatePrice } from "@/hooks/usePrices";
import { DetailPriceTableRequest, DetailPriceTableResponse, ListPriceTableRequest, ListPriceTableResponse, PriceTimeRangeDto } from "@/types-openapi/api";
import { useListProducts } from "@/hooks/useProducts";
import { ApiError } from "@/lib/axios";
import React from "react";
import { useDetailProduct } from "@/hooks/useProducts";
import { axiosInstance as axios } from "@/lib/axios";

const columns = [
  { title: "Tên bảng giá", dataIndex: "name", key: "name" },
  { title: "Hiệu lực", key: "range", render: (_: any, r: ListPriceTableResponse) => {
      const a = r.effectiveFrom ? dayjs(r.effectiveFrom).format("DD/MM/YYYY") : "---";
      const b = r.effectiveTo ? dayjs(r.effectiveTo).format("DD/MM/YYYY") : "---";
      return `${a} - ${b}`;
    }
  },
  { title: "Trạng thái", dataIndex: "isActive", key: "isActive", render: (v: boolean) => v ? <Tag color="green">Kích hoạt</Tag> : <Tag color="red">Chưa áp dụng</Tag> },
];

const PriceManagementPage = () => {
  const [filters, setFilters] = useState<ListPriceTableRequest>({});
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [searchForm] = Form.useForm<{ name?: string; range?: [Dayjs, Dayjs] }>();
  const [searchValues, setSearchValues] = useState<{ name?: string; range?: [Dayjs, Dayjs] }>({});

  const { data, isFetching, refetch } = useListPrices(filters);
  const createMutation = useCreatePrice();
  const updateMutation = useUpdatePrice();
  const deleteMutation = useDeletePrice();
  const [modal, contextHolder] = Modal.useModal();

  const onCreate = () => { setEditingId(null); setOpen(true); };
  const onEdit = (id: number) => { setEditingId(id); setOpen(true); };

  const listData = data?.data ?? [];
  const filteredData = useMemo(() => {
    const name = (searchValues.name || "").trim().toLowerCase();
    const range = searchValues.range;
    return listData.filter((x) => {
      const okName = !name || (x.name || "").toLowerCase().includes(name);
      if (!range || range.length !== 2) return okName;
      const from = range[0]?.startOf("day");
      const to = range[1]?.endOf("day");
      const effFrom = x.effectiveFrom ? dayjs(x.effectiveFrom) : null;
      const effTo = x.effectiveTo ? dayjs(x.effectiveTo) : null;
      const overlap = (!effFrom || !to || effFrom.isBefore(to.add(1, "millisecond"))) && (!effTo || !from || effTo.isAfter(from.subtract(1, "millisecond")));
      return okName && overlap;
    });
  }, [listData, searchValues]);

  const onSearchSubmit = (vals: any) => {
    setSearchValues(vals || {});
  };
  const onSearchReset = () => { searchForm.resetFields(); setSearchValues({}); };

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
            <Button type="primary" icon={<SearchOutlined />} onClick={() => searchForm.submit()}>Tìm kiếm</Button>
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
            <Col span={8}>
              <Form.Item name="range" label="Hiệu lực từ ngày - đến">
                <DatePicker.RangePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="font-bold text-green-500">Tổng số: {filteredData.length}</span>
        </div>
        <div className="flex gap-2">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>Thêm bảng giá</Button>
        </div>
      </div>

      <Table<ListPriceTableResponse>
        rowKey="id"
        columns={[...columns]}
        dataSource={filteredData}
        loading={isFetching}
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
                  onOk: () => deleteMutation.mutate({ id: record.id! }, { onSuccess: () => { message.success("Đã xoá"); refetch(); } }),
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
                      message.error(e?.message || "Lỗi cập nhật trạng thái");
                    }
                  },
                })
              }
            />
          ),
        }}
      />

      {open && (
        <PriceDrawer open={open} onClose={() => setOpen(false)} priceId={editingId} onSaved={() => { setOpen(false); refetch(); }} />
      )}

      {contextHolder}
    </section>
  );
};

const PriceInformation = ({ record, onEdit, onDelete, onChangeStatus }: { record: ListPriceTableResponse; onEdit: () => void; onDelete: () => void; onChangeStatus: (active: boolean) => void }) => {
  const { data } = useDetailPrice({ id: record.id! }, true);
  const d = data?.data as DetailPriceTableResponse | undefined;
  const { data: mapped } = useGetPriceTableProducts(record.id!, true);
  const mapData: any = mapped?.data as any;
  const itemsFromApi: Array<any> = (mapData?.items || mapData?.Items) || [];
  const selectedIdToPrice = new Map<number, number | undefined>(itemsFromApi.map((i: any) => [i.productId ?? i.ProductId, i.overrideSalePrice ?? i.OverrideSalePrice ?? undefined]));
  const { data: allProducts } = useListProducts({} as any);
  const products = (allProducts?.data || []).filter((x) => selectedIdToPrice.has(x.id!));

  const CostCell = ({ productId }: { productId: number }) => {
    const { data: detail } = useDetailProduct({ id: productId }, true);
    const cost = (detail?.data as any)?.costPrice;
    return <>{cost ?? "-"}</>;
  };

  return (
    <div>
      <Row gutter={16} className="mb-3">
        <Col span={12}>
          <Row gutter={8}>
            <Col span={8}>Tên bảng giá:</Col>
            <Col span={16}>{record.name}</Col>
            <Col span={24}><hr /></Col>
            <Col span={8}>Hiệu lực:</Col>
            <Col span={16}>{(record.effectiveFrom ? dayjs(record.effectiveFrom).format("DD/MM/YYYY") : "---") + " - " + (record.effectiveTo ? dayjs(record.effectiveTo).format("DD/MM/YYYY") : "---")}</Col>
            {record.effectiveFrom || record.effectiveTo ? (
              <>
                <Col span={8}></Col>
                <Col span={16}>
                  <small className="text-gray-500">(Từ {record.effectiveFrom ? dayjs(record.effectiveFrom).format("DD/MM/YYYY HH:mm") : "---"} đến {record.effectiveTo ? dayjs(record.effectiveTo).format("DD/MM/YYYY HH:mm") : "---"})</small>
                </Col>
              </>
            ) : null}
          </Row>
        </Col>
        <Col span={12}>
          <Row gutter={8}>
            <Col span={8}>Trạng thái:</Col>
            <Col span={16}><span className={`font-bold ${record.isActive ? "text-green-500" : "text-red-500"}`}>{record.isActive ? "Kích hoạt" : "Chưa áp dụng"}</span></Col>
          </Row>
        </Col>
      </Row>

      {d?.timeRanges && d.timeRanges.length > 0 && (
        <div className="mb-3">
          <div className="mb-2 font-semibold">Khung giờ</div>
          <List
            bordered
            dataSource={d.timeRanges}
            renderItem={(it) => (
              <List.Item>
                <Space>
                  <Tag>{it.startTime} - {it.endTime}</Tag>
                  <span>Giá: {it.price}</span>
                </Space>
              </List.Item>
            )}
          />
        </div>
      )}

      <div className="mb-3">
        <div className="mb-2 font-semibold">Sản phẩm áp dụng</div>
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={products}
          columns={[
            { title: "Mã", dataIndex: "code", key: "code" },
            { title: "Tên hàng", dataIndex: "name", key: "name" },
            { title: "Nhóm", dataIndex: "category", key: "category" },
            { title: "Giá vốn", key: "costPrice", render: (_: any, r: any) => <CostCell productId={r.id} /> },
            { title: "Giá áp dụng", key: "override", render: (_: any, r: any) => selectedIdToPrice.get(r.id) ?? r.salePrice ?? "-" },
          ]}
        />
      </div>

      <div className="flex justify-between">
        <div></div>
        <div className="flex gap-2">
          {record.isActive ? (
            <Button danger icon={<StopOutlined />} onClick={() => onChangeStatus(false)}>Ngừng áp dụng</Button>
          ) : (
            <Button className="!bg-green-500 !text-white !border-green-500 hover:!bg-green-500 hover:!text-white hover:!border-green-500 focus:!shadow-none active:!bg-green-500" icon={<CheckOutlined />} onClick={() => onChangeStatus(true)}>Kích hoạt</Button>
          )}
          <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>Sửa bảng giá</Button>
          <Button danger icon={<DeleteOutlined />} onClick={onDelete}>Xoá</Button>
        </div>
      </div>
    </div>
  );
};

const PriceDrawer = ({ open, onClose, priceId, onSaved }: { open: boolean; onClose: () => void; priceId: number | null; onSaved: () => void }) => {
  const [activeTab, setActiveTab] = useState<string>("info");
  const [form] = Form.useForm<DetailPriceTableResponse & { ranges: PriceTimeRangeDto[]; months?: number[]; daysOfMonth?: number[]; weekdays?: number[]; effective?: [Dayjs, Dayjs] }>();
  const isCreate = !priceId;

  const { data, isFetching } = useDetailPrice({ id: priceId || 0 } as DetailPriceTableRequest, !!priceId);
  const createMutation = useCreatePrice();
  const updateMutation = useUpdatePrice();

  const { data: productIdsRes } = useGetPriceTableProducts(priceId || 0, !!priceId);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  useEffect(() => {
    if (data?.data && open) {
      const d = data.data;
      form.setFieldsValue({
        id: d.id,
        name: d.name,
        isActive: d.isActive,
        months: d.months || [],
        daysOfMonth: d.daysOfMonth || [],
        weekdays: d.weekdays || [],
        effective: [d.effectiveFrom ? dayjs(d.effectiveFrom) : undefined, d.effectiveTo ? dayjs(d.effectiveTo) : undefined] as any,
        ranges: (d.timeRanges || []).map((r) => ({ startTime: r.startTime ? dayjs(r.startTime, "HH:mm:ss") : undefined, endTime: r.endTime ? dayjs(r.endTime, "HH:mm:ss") : undefined, price: r.price })),
      } as any);
    }
  }, [data?.data, open]);

  useEffect(() => {
    if (productIdsRes?.data && open) {
      setSelectedProductIds(productIdsRes.data.productIds || []);
    }
  }, [productIdsRes?.data, open]);

  const onSubmit = (values: any) => {
    const payload = {
      id: values.id,
      name: values.name,
      isActive: !!values.isActive,
      months: values.months?.length ? values.months : undefined,
      daysOfMonth: values.daysOfMonth?.length ? values.daysOfMonth : undefined,
      weekdays: values.weekdays?.length ? values.weekdays : undefined,
      effectiveFrom: values.effective?.[0]?.toISOString?.(),
      effectiveTo: values.effective?.[1]?.toISOString?.(),
      timeRanges: (values.ranges || []).map((r: any) => ({ startTime: r.startTime ? dayjs(r.startTime).format("HH:mm:ss") : undefined, endTime: r.endTime ? dayjs(r.endTime).format("HH:mm:ss") : undefined, price: r.price })),
    } as any;

    if (isCreate) {
      createMutation.mutate(payload, { onSuccess: () => { message.success("Tạo bảng giá thành công"); onSaved(); } });
    } else {
      updateMutation.mutate(payload, { onSuccess: () => { message.success("Cập nhật bảng giá thành công"); onSaved(); } });
    }
  };

  return (
    <Drawer width={900} open={open} onClose={onClose} destroyOnClose title={isCreate ? "Thêm bảng giá" : "Cập nhật bảng giá"}>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: "info", label: "Thông tin", children: (
          <Form layout="vertical" form={form} onFinish={onSubmit}>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="name" label="Tên bảng giá" rules={[{ required: true, message: "Nhập tên" }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="effective" label="Hiệu lực từ ngày - đến" ><DatePicker.RangePicker style={{ width: "100%" }} /></Form.Item></Col>
              <Col span={6}><Form.Item name="isActive" label="Trạng thái"><Switch checkedChildren="Kích hoạt" unCheckedChildren="Chưa áp dụng" /></Form.Item></Col>
            </Row>

            <Form.List name="ranges">
              {(fields, { add, remove }) => (
                <Card title="Khung giờ" extra={<Button onClick={() => add({ startTime: dayjs("08:00", "HH:mm"), endTime: dayjs("12:00", "HH:mm") })} icon={<PlusOutlined />}>Thêm khung giờ</Button>}>
                  {fields.map((field) => (
                    <Row key={field.key} gutter={12} align="middle" className="mb-2">
                      <Col span={7}><Form.Item name={[field.name, "startTime"]} label="Từ giờ" rules={[{ required: true }]}><TimePicker format="HH:mm" style={{ width: "100%" }} /></Form.Item></Col>
                      <Col span={7}><Form.Item name={[field.name, "endTime"]} label="Đến" rules={[{ required: true }]}><TimePicker format="HH:mm" style={{ width: "100%" }} /></Form.Item></Col>
                      <Col span={4}><Button danger onClick={() => remove(field.name)}>Xoá</Button></Col>
                    </Row>
                  ))}
                </Card>
              )}
            </Form.List>

            <div className="mt-3 text-right"><Space><Button onClick={onClose}>Đóng</Button><Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Lưu</Button></Space></div>
          </Form>
        ) },
        { key: "scope", label: "Phạm vi áp dụng", children: <ProductsSelector priceId={priceId} selected={selectedProductIds} onChangeSelected={setSelectedProductIds} /> },
      ]} />
    </Drawer>
  );
};

const ProductsSelector = ({ priceId, selected, onChangeSelected }: { priceId: number | null; selected: number[]; onChangeSelected: (v: number[]) => void }) => {
  const [params, setParams] = useState<any>({});
  const [form] = Form.useForm<any>();
  const { data: productsRes, isFetching } = useListProducts(params);
  const { data: mapped } = useGetPriceTableProducts(priceId || 0, !!priceId);
  const [rowsState, setRowsState] = useState<Record<number, number | undefined>>({});
  const setProducts = useSetPriceTableProducts();

  const rows = productsRes?.data ?? [];
  const CostCell = ({ productId }: { productId: number }) => {
    const { data: detail } = useDetailProduct({ id: productId }, true);
    const cost = (detail?.data as any)?.costPrice;
    return <>{cost ?? "-"}</>;
  };

  useEffect(() => {
    if (mapped?.data && priceId) {
      const initial: Record<number, number | undefined> = {};
      const md: any = mapped.data as any;
      const arr: Array<any> = (md?.items || md?.Items || (md?.productIds || []).map((id: number) => ({ productId: id })));
      arr.forEach((i: any) => { initial[i.productId ?? i.ProductId] = i.overrideSalePrice ?? i.OverrideSalePrice ?? undefined; });
      setRowsState(initial);
      onChangeSelected(arr.map((i: any) => i.productId ?? i.ProductId));
    }
  }, [mapped?.data, priceId]);

  const rowSelection = {
    selectedRowKeys: selected,
    onChange: (keys: React.Key[]) => onChangeSelected(keys.map((k) => Number(k))),
  };

  const onSearch = (v: any) => {
    setParams({
      code: v.code || undefined,
      name: v.name || undefined,
      category: v.category || undefined,
      menuType: v.menuType || undefined,
      isActive: typeof v.isActive === "boolean" ? v.isActive : undefined,
    });
  };

  const onReset = () => {
    form.resetFields();
    setParams({});
  };

  const onSave = () => {
    if (!priceId) return;
    const items = selected.map((id) => {
      const row = rows.find((r: any) => r.id === id);
      const value = rowsState[id] ?? row?.salePrice;
      return { productId: id, overrideSalePrice: value };
    });
    const productIds = selected;
    setProducts.mutate({ priceTableId: priceId, items, productIds } as any, { onSuccess: () => message.success("Đã lưu sản phẩm áp dụng") });
  };

  return (
    <Card
      title="Chọn sản phẩm áp dụng"
      extra={<Space><Button onClick={onReset}>Reset</Button><Button icon={<SearchOutlined />} type="primary" onClick={() => form.submit()}>Tìm kiếm</Button><Button type="primary" onClick={onSave}>Lưu</Button></Space>}
    >
      <Form form={form} layout="inline" onFinish={onSearch} className="mb-3">
        <Form.Item name="code" label="Mã code"><Input placeholder="Nhập mã" allowClear /></Form.Item>
        <Form.Item name="name" label="Tên hàng"><Input placeholder="Nhập tên" allowClear /></Form.Item>
        <Form.Item name="category" label="Nhóm hàng"><Input placeholder="Nhập nhóm" allowClear /></Form.Item>
        <Form.Item name="menuType" label="Loại"><Select allowClear style={{ width: 160 }} options={[{ value: "Đồ ăn", label: "Đồ ăn" }, { value: "Đồ uống", label: "Đồ uống" }, { value: "Khác", label: "Khác" }]} /></Form.Item>
        <Form.Item name="isActive" label="Trạng thái"><Select allowClear style={{ width: 160 }} options={[{ value: true, label: "Đang hoạt động" }, { value: false, label: "Ngừng hoạt động" }]} /></Form.Item>
      </Form>

      <Table
        rowKey="id"
        dataSource={rows}
        loading={isFetching}
        rowSelection={rowSelection as any}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: "Mã", dataIndex: "code" },
          { title: "Tên hàng", dataIndex: "name" },
          { title: "Nhóm", dataIndex: "category" },
          { title: "Giá vốn", key: "costPrice", render: (_: any, r: any) => <CostCell productId={r.id} /> },
          { title: "Giá áp dụng", key: "overrideSalePrice", render: (_: any, r: any) => (
            <InputNumber min={0} style={{ width: 140 }} value={rowsState[r.id] ?? r.salePrice} onChange={(val) => setRowsState((s) => ({ ...s, [r.id]: val as number }))} />
          ) },
          { title: "Kinh doanh", dataIndex: "isActive", render: (v: boolean) => v ? <Tag color="green">Đang hoạt động</Tag> : <Tag color="red">Ngừng</Tag> },
        ]}
      />
    </Card>
  );
};

export default PriceManagementPage; 