"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb, Button, Card, Checkbox, Col, DatePicker, Form, Input, Row, Space, Table, Tag, Select, Modal, message, Tabs } from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import CreateEditReturnGoodsDrawer from "@/components/quanlysancaulong/stock-return/create-edit-return-goods-drawer";
import { returnGoodsService } from "@/services/returnGoodsService";
import { useListSuppliers } from "@/hooks/useSuppliers";

type ReturnGoodsRow = {
  id: number;
  code: string;
  time: Date;
  supplierName?: string;
  supplierId?: number;
  needPay?: number;
  status: 0 | 1 | 2; // draft, completed, cancelled
};

const statusColors = { 0: "orange", 1: "green", 2: "red" } as const;
const statusLabels = { 0: "Phiếu tạm", 1: "Đã trả hàng", 2: "Đã hủy" } as const;

const StockReturnPage = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchForm] = Form.useForm();
  const [filters, setFilters] = useState<{
    code?: string;
    product?: string;
    supplierId?: number;
    createdBy?: string;
    range?: [dayjs.Dayjs, dayjs.Dayjs];
    statuses?: number[];
  }>({ statuses: [0, 1] });

  const [data, setData] = useState<ReturnGoodsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: suppliersData } = useListSuppliers({});

  const load = async () => {
    try {
      setLoading(true);
      const range = resolvedRange;
      const from = range?.[0]?.toISOString();
      const to = range?.[1]?.toISOString();
      const status = filters.statuses && filters.statuses.length === 1 ? filters.statuses[0] : undefined;
      const res = await returnGoodsService.list({ from, to, status } as any);
      const list = (res.data || []).map((r: any) => ({
        id: r.id,
        code: r.code,
        time: new Date(r.returnTime),
        supplierName: r.supplierName,
        supplierId: r.supplierId,
        needPay: r.supplierNeedToPay,
        status: r.status as 0 | 1 | 2,
      })) as ReturnGoodsRow[];
      setData(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.statuses]);

  useEffect(() => {
    if (editingId !== null) setOpen(true);
  }, [editingId]);

  const resolvedRange = useMemo(() => {
    if (filters.range && filters.range.length === 2) return filters.range;
    return [dayjs().startOf("month"), dayjs().endOf("month")] as [dayjs.Dayjs, dayjs.Dayjs];
  }, [filters.range]);

  const filtered = useMemo(() => {
    const statuses = filters.statuses && filters.statuses.length > 0 ? new Set(filters.statuses) : undefined;
    const code = (filters.code || "").toLowerCase();
    const supplierId = filters.supplierId;
    const range = resolvedRange;
    return data.filter((x) => {
      const okCode = !code || (x.code || "").toLowerCase().includes(code);
      const okSup =
        !supplierId ||
        x.supplierId === supplierId ||
        (x.supplierName || "").toLowerCase() === (suppliersData?.data?.find((s: any) => s.id === supplierId)?.name || "").toLowerCase();
      const okStatus = !statuses || statuses.has(x.status);
      const t = dayjs(x.time);
      const okTime = !range || (t.isAfter(range[0].startOf("day")) && t.isBefore(range[1].endOf("day")));
      return okCode && okSup && okStatus && okTime;
    });
  }, [data, filters, resolvedRange, suppliersData?.data]);

  const onCreate = () => {
    setEditingId(null);
    setOpen(true);
  };

  return (
    <section>
      <div className="mb-3">
        <Breadcrumb items={[{ title: "Quản lý kho" }, { title: "Phiếu trả hàng" }]} />
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
                  setFilters({ statuses: [0, 1] });
                }}
              >
                Reset
              </Button>
            </Space>
          }
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="code" label="Theo mã phiếu nhập">
                <Input allowClear placeholder="Theo mã phiếu nhập" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="product" label="Theo mã, tên hàng">
                <Input allowClear placeholder="Theo mã, tên hàng" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="supplierId" label="Theo NCC">
                <Select
                  allowClear
                  showSearch
                  placeholder="Chọn nhà cung cấp"
                  optionFilterProp="label"
                  options={(suppliersData?.data || []).map((s: any) => ({ label: s.name, value: s.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="createdBy" label="Theo người tạo">
                <Input allowClear placeholder="Theo người tạo" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Trạng thái" name="statuses">
                <Checkbox.Group style={{ width: "100%" }} onChange={(vals) => setFilters({ ...filters, statuses: vals as number[] })}>
                  <Row gutter={[0, 8]}>
                    <Col span={24}>
                      <Checkbox value={0}>Phiếu tạm</Checkbox>
                    </Col>
                    <Col span={24}>
                      <Checkbox value={1}>Đã trả hàng</Checkbox>
                    </Col>
                    <Col span={24}>
                      <Checkbox value={2}>Đã hủy</Checkbox>
                    </Col>
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Thời gian">
                <Form.Item name="range" noStyle>
                  <DatePicker.RangePicker style={{ width: 280 }} />
                </Form.Item>
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
            Trả hàng
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Table<ReturnGoodsRow>
          rowKey="id"
          size="small"
          bordered
          scroll={{ x: "max-content" }}
          columns={[
            { title: "Mã trả hàng", dataIndex: "code", key: "code", width: 140 },
            { title: "Thời gian", dataIndex: "time", key: "time", width: 160, render: (d: Date) => dayjs(d).format("DD/MM/YYYY HH:mm") },
            { title: "Nhà cung cấp", dataIndex: "supplierName", key: "supplierName", width: 220, render: (t?: string) => t || "-" },
            { title: "NCC cần trả", dataIndex: "needPay", key: "needPay", width: 140, render: (v?: number) => (v ?? 0).toLocaleString() },
            {
              title: "Trạng thái",
              dataIndex: "status",
              key: "status",
              width: 140,
              render: (s: ReturnGoodsRow["status"]) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag>,
            },
          ]}
          dataSource={filtered}
          loading={loading}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => (
              <ReturnGoodsRowDetail record={record} onEdit={() => setEditingId((record as any).id)} onCancelled={load} />
            ),
          }}
          pagination={false}
        />
      </div>

      <CreateEditReturnGoodsDrawer
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
        }}
        onChanged={() => load()}
        returnGoodsId={editingId ?? undefined}
      />
    </section>
  );
};

export default StockReturnPage;

const ReturnGoodsRowDetail = ({ record, onEdit, onCancelled }: { record: any; onEdit: () => void; onCancelled: () => void }) => {
  const [detail, setDetail] = React.useState<any | null>(null);
  React.useEffect(() => {
    const run = async () => {
      try {
        const res = await returnGoodsService.detail(record.id);
        setDetail(res.data);
      } catch {
        setDetail(null);
      }
    };
    run();
  }, [record?.id]);

  const methodLabel = React.useMemo(() => {
    const m = detail?.paymentMethod || record?.paymentMethod;
    return m === 1 ? "Chuyển khoản" : "Tiền mặt";
  }, [detail?.paymentMethod, record?.paymentMethod]);

  const paymentsRows = React.useMemo(() => {
    if (!detail) return [] as any[];
    const paymentStatus = detail.status === 1 ? "Đã thanh toán" : detail.status === 2 ? "Đã hủy" : "Chưa thanh toán";
    return [
      {
        code: detail.code,
        time: dayjs(detail.returnTime).format("DD/MM/YYYY HH:mm"),
        method:
          methodLabel +
          (detail.paymentMethod === 1
            ? ` (${detail.storeBankAccount?.accountNumber || "-"}${detail.storeBankAccount?.accountName ? ` - ${detail.storeBankAccount.accountName}` : ""}${detail.storeBankAccount?.bankName ? ` - ${detail.storeBankAccount.bankName}` : ""})`
            : ""),
        status: paymentStatus,
        amount: (detail.supplierPaid ?? 0).toLocaleString(),
      },
    ];
  }, [detail, methodLabel]);

  const paymentSummary = React.useMemo(() => {
    const items = (detail?.items || []) as any[];
    const totalAmount = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.returnPrice || 0), 0);
    const discount = Number(detail?.discount || 0);
    const needPay = Math.max(0, totalAmount - discount);
    const paid = Number(detail?.supplierPaid || 0);
    const debt = Math.max(0, needPay - paid);
    return { totalAmount, discount, needPay, paid, debt };
  }, [detail?.items, detail?.discount, detail?.supplierPaid]);

  return (
    <div className="p-3">
      <Tabs
        defaultActiveKey="info"
        items={[
          {
            key: "info",
            label: "Thông tin",
            children: (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div>
                  <div className="text-gray-500">Mã phiếu:</div>
                  <div className="font-semibold">{record.code}</div>
                </div>
                <div>
                  <div className="text-gray-500">Thời gian:</div>
                  <div className="font-semibold">{dayjs(record.time).format("DD/MM/YYYY HH:mm")}</div>
                </div>
                <div>
                  <div className="text-gray-500">Nhà cung cấp:</div>
                  <div className="font-semibold">{record.supplierName || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">NCC cần trả:</div>
                  <div className="font-semibold">{(record.needPay ?? 0).toLocaleString()}</div>
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
                          content: "Bạn có chắc chắn muốn hủy phiếu trả hàng này?",
                          okText: "Hủy phiếu",
                          cancelText: "Đóng",
                          okButtonProps: { danger: true },
                          onOk: async () => {
                            try {
                              await returnGoodsService.cancel(record.id);
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
            ),
          },
          {
            key: "items",
            label: "Sản phẩm",
            children: <ReturnGoodsProducts returnGoodsId={record.id} />,
          },
          {
            key: "payments",
            label: "Lịch sử thanh toán",
            children: (
              <div>
                <Table<any>
                  size="small"
                  rowKey={(r) => (r as any).code || Math.random().toString(36).slice(2)}
                  dataSource={paymentsRows}
                  pagination={false}
                  locale={{ emptyText: "Chưa có dữ liệu thanh toán" }}
                  columns={[
                    { title: "Mã phiếu", dataIndex: "code", key: "code", width: 160 },
                    { title: "Thời gian", dataIndex: "time", key: "time", width: 180 },
                    { title: "Phương thức", dataIndex: "method", key: "method", width: 160 },
                    {
                      title: "Trạng thái",
                      dataIndex: "status",
                      key: "status",
                      width: 140,
                      render: (t: string) => <Tag color={t === "Đã thanh toán" ? "green" : t === "Đã hủy" ? "red" : "orange"}>{t}</Tag>,
                    },
                    { title: "Tiền trả NCC", dataIndex: "amount", key: "amount", width: 140 },
                  ]}
                />
                <div className="mt-3 space-y-1 text-right">
                  <div>
                    <span className="text-gray-600">Tổng tiền hàng trả</span>
                    <span className="ml-2 font-semibold">{paymentSummary.totalAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Giảm giá</span>
                    <span className="ml-2 font-semibold">{paymentSummary.discount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">NCC cần trả</span>
                    <span className="ml-2 font-semibold">{paymentSummary.needPay.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tiền NCC đã trả</span>
                    <span className="ml-2 font-semibold text-green-600">{paymentSummary.paid.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tính vào công nợ</span>
                    <span className="ml-2 font-semibold text-red-600">{paymentSummary.debt.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

const ReturnGoodsProducts = ({ returnGoodsId }: { returnGoodsId: number }) => {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await returnGoodsService.detail(returnGoodsId);
        const d = res.data;
        setRows(
          (d?.items || []).map((i) => ({
            code: i.productCode || i.productId,
            name: i.productName || "",
            quantity: i.quantity,
            importPrice: i.importPrice,
            returnPrice: i.returnPrice,
            amount: (i.quantity || 0) * (i.returnPrice || 0),
          })),
        );
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [returnGoodsId]);

  return (
    <Table
      size="small"
      bordered
      loading={loading}
      rowKey={(r) => String((r as any).code) + String((r as any).name)}
      dataSource={rows}
      pagination={false}
      columns={[
        { title: "Mã hàng", dataIndex: "code", key: "code", width: 140 },
        { title: "Tên hàng", dataIndex: "name", key: "name", width: 220 },
        { title: "SL trả", dataIndex: "quantity", key: "quantity", width: 120 },
        { title: "Giá nhập", dataIndex: "importPrice", key: "importPrice", width: 140, render: (v) => (v ?? 0).toLocaleString() },
        { title: "Giá trả", dataIndex: "returnPrice", key: "returnPrice", width: 140, render: (v) => (v ?? 0).toLocaleString() },
        { title: "Thành tiền", dataIndex: "amount", key: "amount", width: 160, render: (v) => (v ?? 0).toLocaleString() },
      ]}
      locale={{ emptyText: "Chưa có sản phẩm" }}
    />
  );
};
