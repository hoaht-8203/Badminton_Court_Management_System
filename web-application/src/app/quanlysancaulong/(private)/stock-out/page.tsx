"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb, Button, Card, Checkbox, Col, DatePicker, Form, Input, Row, Space, Table, Tag, Tabs, message, Select, Modal } from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import CreateEditStockOutDrawer from "@/components/quanlysancaulong/stock-out/create-edit-stock-out-drawer";
import { stockOutService } from "@/services/stockOutService";

type StockOut = {
  id: number;
  code: string;
  outTime: Date;
  supplierId?: number;
  supplierName?: string;
  outBy?: string;
  totalValue?: number;
  status: 0 | 1 | 2; // draft, completed, cancelled
};

const statusColors = { 0: "orange", 1: "green", 2: "red" } as const;
const statusLabels = { 0: "Phiếu tạm", 1: "Hoàn thành", 2: "Đã hủy" } as const;

const StockOutPage = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchForm] = Form.useForm();
  const [filters, setFilters] = useState<{
    code?: string;
    product?: string;
    supplierId?: number;
    outBy?: string;
    range?: [dayjs.Dayjs, dayjs.Dayjs];
    statuses?: number[];
  }>({
    statuses: [0, 1],
    range: [dayjs().startOf("day"), dayjs().endOf("day")],
  });

  const [data, setData] = useState<StockOut[]>([]);
  const [loading, setLoading] = useState(false);

  const resolvedRange = useMemo(() => {
    if (filters.range && filters.range.length === 2) return filters.range;
    return [dayjs().startOf("month"), dayjs().endOf("month")] as [dayjs.Dayjs, dayjs.Dayjs];
  }, [filters.range]);

  const load = async () => {
    try {
      setLoading(true);
      const range = resolvedRange;
      const from = range?.[0]?.toDate();
      const to = range?.[1]?.toDate();
      const status = filters.statuses && filters.statuses.length === 1 ? filters.statuses[0] : undefined;
      const res = await stockOutService.list({ from, to, status } as any);
      const list = (res.data || []).map((r: any) => ({
        id: r.id,
        code: r.code,
        outTime: new Date(r.outTime),
        supplierId: r.supplierId,
        supplierName: r.supplierName,
        outBy: r.outBy,
        totalValue: r.totalValue,
        status: r.status as 0 | 1 | 2,
      })) as StockOut[];
      setData(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto reload only when statuses change (others require Search click)
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.statuses]);

  // Open drawer when editingId changes
  useEffect(() => {
    if (editingId !== null) setOpen(true);
  }, [editingId]);

  const supplierOptions = useMemo(() => {
    const uniq = Array.from(new Set((data || []).map((x) => x.supplierId).filter(Boolean)));
    return uniq.map((sId) => {
      const supplier = data.find((x) => x.supplierId === sId);
      return { label: supplier?.supplierName || `Supplier ${sId}`, value: sId };
    });
  }, [data]);

  const filtered = useMemo(() => {
    const statuses = filters.statuses && filters.statuses.length > 0 ? new Set(filters.statuses) : undefined;
    const code = (filters.code || "").toLowerCase();
    const supplierId = filters.supplierId;
    const outBy = (filters.outBy || "").toLowerCase();
    const range = resolvedRange;
    return data.filter((x) => {
      const okCode = !code || (x.code || "").toLowerCase().includes(code);
      const okSupplier = !supplierId || x.supplierId === supplierId;
      const okOutBy = !outBy || (x.outBy || "").toLowerCase().includes(outBy);
      const okStatus = !statuses || statuses.has(x.status);
      const t = dayjs(x.outTime);
      const okTime = !range || (t.isAfter(range[0].startOf("day")) && t.isBefore(range[1].endOf("day")));
      return okCode && okSupplier && okOutBy && okStatus && okTime;
    });
  }, [data, filters, resolvedRange]);

  const onCreate = () => {
    setEditingId(null);
    setOpen(true);
  };

  return (
    <section>
      <div className="mb-3">
        <Breadcrumb items={[{ title: "Quản lý kho" }, { title: "Phiếu xuất hủy" }]} />
      </div>

      <Form
        form={searchForm}
        layout="vertical"
        onFinish={(vals) => {
          setFilters({ ...filters, ...vals });
          load();
        }}
        initialValues={filters}
      >
        <Card
          className="mb-3"
          title="Lọc dữ liệu"
          extra={
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => searchForm.submit()}>
                Tìm kiếm
              </Button>
              <Button
                onClick={() => {
                  searchForm.resetFields();
                  setFilters({ statuses: [0, 1], range: [dayjs().startOf("day"), dayjs().endOf("day")] });
                }}
              >
                Reset
              </Button>
            </Space>
          }
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="code" label="Theo mã phiếu xuất">
                <Input allowClear placeholder="Theo mã phiếu xuất" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="product" label="Theo mã, tên hàng">
                <Input allowClear placeholder="Theo mã, tên hàng" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="supplierId" label="Theo nhà cung cấp">
                <Select allowClear showSearch placeholder="Chọn nhà cung cấp" optionFilterProp="label" options={supplierOptions} />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item name="outBy" label="Theo người xuất">
                <Input allowClear placeholder="Theo người xuất" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Thời gian">
                <Form.Item name="range" noStyle>
                  <DatePicker.RangePicker style={{ width: 280 }} />
                </Form.Item>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Trạng thái" name="statuses">
                <Checkbox.Group style={{ width: "100%" }} onChange={(vals) => setFilters({ ...filters, statuses: vals as number[] })}>
                  <Row gutter={[0, 8]}>
                    <Col span={24}>
                      <Checkbox value={0}>Phiếu tạm</Checkbox>
                    </Col>
                    <Col span={24}>
                      <Checkbox value={1}>Hoàn thành</Checkbox>
                    </Col>
                    <Col span={24}>
                      <Checkbox value={2}>Đã hủy</Checkbox>
                    </Col>
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>

      <div className="mt-2 flex items-center justify-between">
        <div>
          <span className="font-bold text-green-500">Tổng số: {filtered.length}</span>
        </div>
        <div className="flex gap-2">
          <Button icon={<ReloadOutlined />} onClick={() => load()}>
            Tải lại
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Xuất hủy
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Table<StockOut>
          rowKey="id"
          size="small"
          bordered
          scroll={{ x: "max-content" }}
          columns={[
            { title: "Mã xuất hủy", dataIndex: "code", key: "code", width: 140 },
            { title: "Thời gian", dataIndex: "outTime", key: "outTime", width: 160, render: (d: Date) => dayjs(d).format("DD/MM/YYYY HH:mm") },
            { title: "Nhà cung cấp", dataIndex: "supplierName", key: "supplierName", width: 220, render: (t?: string) => t || "-" },
            { title: "Người xuất", dataIndex: "outBy", key: "outBy", width: 160, render: (t?: string) => t || "-" },
            { title: "Tổng giá trị", dataIndex: "totalValue", key: "totalValue", width: 140, render: (v?: number) => (v ?? 0).toLocaleString() },
            {
              title: "Trạng thái",
              dataIndex: "status",
              key: "status",
              width: 140,
              render: (s: StockOut["status"]) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag>,
            },
          ]}
          dataSource={filtered}
          loading={loading}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => <StockOutRowDetail record={record} onEdit={() => setEditingId((record as any).id)} onCancelled={load} />,
          }}
          pagination={false}
        />
      </div>

      <CreateEditStockOutDrawer
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
        }}
        onChanged={() => load()}
        stockOutId={editingId ?? undefined}
      />
    </section>
  );
};

export default StockOutPage;

const StockOutRowDetail = ({ record, onEdit, onCancelled }: { record: any; onEdit: () => void; onCancelled: () => void }) => {
  const [detail, setDetail] = React.useState<any | null>(null);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const run = async () => {
      try {
        const res = await stockOutService.detail(record.id);
        setDetail(res.data);
        setNote(res.data?.note || "");
      } catch {
        setDetail(null);
      }
    };
    run();
  }, [record?.id]);

  const handleSaveNote = async () => {
    if (!detail) return;
    try {
      setSaving(true);

      // Phiếu tạm: cập nhật toàn bộ thông tin
      if (detail.status === 0) {
        // Draft
        const updatePayload = {
          outTime: detail.outTime,
          supplierId: detail.supplierId,
          outBy: detail.outBy,
          note: note,
          items: detail.items?.map((i: any) => ({ productId: i.productId, quantity: i.quantity, costPrice: i.costPrice })) || [],
        };
        await stockOutService.update(record.id, updatePayload);
      } else {
        // Phiếu hoàn thành/hủy: chỉ cập nhật ghi chú
        await stockOutService.updateNote(record.id, note);
      }

      message.success("Đã lưu ghi chú thành công");

      // Reload detail to get updated note
      const res = await stockOutService.detail(record.id);
      setDetail(res.data);
      setNote(res.data?.note || "");
    } catch (e: any) {
      message.error(e?.message || "Lưu ghi chú thất bại");
    } finally {
      setSaving(false);
    }
  };

  const infoTab = (
    <div className="p-3">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div>
          <div className="text-gray-500">Mã xuất hủy:</div>
          <div className="font-semibold">{record.code}</div>
        </div>
        <div>
          <div className="text-gray-500">Thời gian:</div>
          <div className="font-semibold">{dayjs(record.outTime).format("DD/MM/YYYY HH:mm")}</div>
        </div>
        <div>
          <div className="text-gray-500">Nhà cung cấp:</div>
          <div className="font-semibold">{record.supplierName || "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Người xuất:</div>
          <div className="font-semibold">{record.outBy || "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Tổng giá trị:</div>
          <div className="font-semibold">{(record.totalValue ?? 0).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-500">Trạng thái:</div>
          {(() => {
            const s = record.status as 0 | 1 | 2;
            return (
              <div className="font-semibold">
                <Tag color={statusColors[s]}>{statusLabels[s]}</Tag>
              </div>
            );
          })()}
        </div>
        <div className="md:col-span-3">
          <div className="mb-2 text-gray-500">Ghi chú:</div>
          <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nhập ghi chú..." rows={3} className="mb-2" />
          <div className="flex justify-end">
            <Button type="primary" size="small" loading={saving} onClick={handleSaveNote}>
              Lưu ghi chú
            </Button>
          </div>
        </div>
        {record.status === 0 && (
          <div className="space-x-2 text-right md:col-span-3">
            <Button type="primary" onClick={onEdit}>
              Cập nhật
            </Button>
            <Button
              danger
              onClick={() => {
                Modal.confirm({
                  title: "Xác nhận hủy phiếu",
                  content: "Bạn có chắc chắn muốn hủy phiếu xuất hủy này?",
                  okText: "Hủy phiếu",
                  cancelText: "Đóng",
                  okButtonProps: { danger: true },
                  onOk: async () => {
                    try {
                      await stockOutService.cancel(record.id);
                      message.success("Đã hủy phiếu");
                      onCancelled();
                    } catch (e: any) {
                      message.error(e?.message || "Hủy thất bại");
                    }
                  },
                });
              }}
            >
              Hủy phiếu
            </Button>
          </div>
        )}
      </div>

      {detail && (
        <div className="mt-4">
          <h4 className="mb-3 text-lg font-semibold">Danh sách sản phẩm xuất hủy</h4>
          <div className="max-h-96 overflow-y-auto">
            <Table
              size="small"
              rowKey={(r) => (r as any).productId}
              dataSource={detail.items || []}
              pagination={false}
              scroll={{ x: "max-content" }}
              columns={[
                { title: "Mã hàng hóa", dataIndex: "productCode", key: "productCode", width: 160 },
                { title: "Tên hàng", dataIndex: "productName", key: "productName", width: 220 },
                { title: "SL hủy", dataIndex: "quantity", key: "quantity", width: 120 },
                { title: "Giá vốn", dataIndex: "costPrice", key: "costPrice", width: 140, render: (v) => (v ?? 0).toLocaleString() },
                {
                  title: "Giá trị hủy",
                  key: "totalValue",
                  width: 160,
                  render: (_, r: any) => ((r.quantity || 0) * (r.costPrice || 0)).toLocaleString(),
                },
              ]}
              locale={{ emptyText: "Chưa có sản phẩm" }}
            />
          </div>
        </div>
      )}
    </div>
  );

  return <Tabs defaultActiveKey="info" items={[{ key: "info", label: "Thông tin", children: infoTab }]} />;
};
