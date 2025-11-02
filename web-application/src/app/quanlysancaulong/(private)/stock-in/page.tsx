"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb, Button, Card, Checkbox, Col, DatePicker, Form, Input, Row, Space, Table, Tag, Tabs, message, Select, Modal } from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import CreateEditStockInDrawer from "@/components/quanlysancaulong/stock-in/create-edit-stock-in-drawer";
import CreateNewProductDrawer from "@/components/quanlysancaulong/products/create-new-product-drawer";
import { receiptsService } from "@/services/receiptsService";
import { useListSuppliers } from "@/hooks/useSuppliers";
import { CreateReceiptRequest } from "@/types-openapi/api";

// Component để tính tổng số tiền đã trả NCC
const TotalPaymentSummaryCell = ({ receiptIds }: { receiptIds: number[] }) => {
  const [totalPayment, setTotalPayment] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateTotalPayment = async () => {
      setLoading(true);
      try {
        let total = 0;
        for (const receiptId of receiptIds) {
          try {
            const res = await receiptsService.detail(receiptId);
            total += res.data?.paymentAmount ?? 0;
          } catch (error) {
            console.error(`Error fetching payment for receipt ${receiptId}:`, error);
          }
        }
        setTotalPayment(total);
      } catch (error) {
        console.error("Error calculating total payment:", error);
      } finally {
        setLoading(false);
      }
    };

    if (receiptIds.length > 0) {
      calculateTotalPayment();
    } else {
      setTotalPayment(0);
      setLoading(false);
    }
  }, [receiptIds]);

  if (loading) return <span>...</span>;
  return <span className="font-bold text-black">{totalPayment.toLocaleString("vi-VN")}</span>;
};

type Receipt = {
  id: number;
  code: string;
  time: Date;
  supplierName?: string;
  supplierId?: number;
  needPay?: number;
  status: 0 | 1 | 2; // draft, completed, cancelled
};

const statusColors = { 0: "orange", 1: "green", 2: "red" } as const;
const statusLabels = { 0: "Phiếu tạm", 1: "Đã nhập hàng", 2: "Đã hủy" } as const;

const StockInPage = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openProductDrawer, setOpenProductDrawer] = useState(false);
  const [searchForm] = Form.useForm();
  const [filters, setFilters] = useState<{
    code?: string;
    product?: string;
    supplierId?: number;
    createdBy?: string;
    range?: [dayjs.Dayjs, dayjs.Dayjs];
    statuses?: number[];
  }>({
    statuses: [0, 1],
  });

  const [data, setData] = useState<Receipt[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const { data: suppliersData } = useListSuppliers({});
  const [productMatchIds, setProductMatchIds] = useState<Set<number> | null>(null);
  const [debouncedProduct, setDebouncedProduct] = useState<string>("");

  const load = async () => {
    try {
      setLoading(true);
      const range = resolvedRange;
      const from = range?.[0]?.toISOString();
      const to = range?.[1]?.toISOString();
      const status = filters.statuses && filters.statuses.length === 1 ? filters.statuses[0] : undefined;
      const res = await receiptsService.list({ from, to, status } as any);
      const list = (res.data || []).map((r: any) => ({
        id: r.id,
        code: r.code,
        time: new Date(r.receiptTime),
        supplierName: r.supplierName,
        supplierId: r.supplierId,
        needPay: r.needPay,
        status: r.status as 0 | 1 | 2,
      })) as Receipt[];
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
      const okProduct = !debouncedProduct || (productMatchIds?.has(x.id) ?? false);
      return okCode && okSup && okStatus && okTime && okProduct;
    });
  }, [data, filters, resolvedRange, productMatchIds, debouncedProduct, suppliersData?.data]);

  // debounce product query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedProduct((filters.product || "").trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [filters.product]);

  // build productMatchIds by fetching receipt details when product query present
  useEffect(() => {
    const run = async () => {
      const q = debouncedProduct;
      if (!q) {
        setProductMatchIds(null);
        return;
      }
      const prelim = data.filter((x) => {
        const statuses = filters.statuses && filters.statuses.length > 0 ? new Set(filters.statuses) : undefined;
        const okStatus = !statuses || statuses.has(x.status);
        const range = resolvedRange;
        const t = dayjs(x.time);
        const okTime = !range || (t.isAfter(range[0].startOf("day")) && t.isBefore(range[1].endOf("day")));
        const okSup = !filters.supplierId || x.supplierId === filters.supplierId;
        return okStatus && okTime && okSup;
      });
      const concurrency = 5;
      const ids = prelim.map((p) => p.id);
      const chunks: number[][] = [];
      for (let i = 0; i < ids.length; i += concurrency) chunks.push(ids.slice(i, i + concurrency));
      const matched = new Set<number>();
      for (const batch of chunks) {
        const results = await Promise.all(
          batch.map(async (id) => {
            try {
              const res = await receiptsService.detail(id);
              return { id, data: res.data };
            } catch {
              return { id, data: null };
            }
          }),
        );
        for (const r of results) {
          const items = (r.data?.items || []) as any[];
          if (
            items.some(
              (it) =>
                String(it.productCode || "")
                  .toLowerCase()
                  .includes(q) ||
                String(it.productName || "")
                  .toLowerCase()
                  .includes(q),
            )
          ) {
            matched.add(r.id);
          }
        }
      }
      setProductMatchIds(matched);
    };
    run();
  }, [debouncedProduct, data, filters.supplierId, resolvedRange, filters.statuses]);

  const onCreate = () => {
    setEditingId(null);
    setOpen(true);
  };

  // Add summary row to dataSource
  const tableData = useMemo(() => {
    const summaryRow: any = { id: "summary", isSummaryRow: true };
    return [summaryRow, ...filtered];
  }, [filtered]);

  return (
    <section>
      <div className="mb-3">
        <Breadcrumb items={[{ title: "Quản lý kho" }, { title: "Phiếu nhập hàng" }]} />
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
                      <Checkbox value={1}>Đã nhập hàng</Checkbox>
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
          <Button onClick={() => setOpenProductDrawer(true)}>
            Thêm sản phẩm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Nhập hàng
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Table<Receipt>
          rowKey="id"
          size="small"
          bordered
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "Mã nhập hàng",
              dataIndex: "code",
              key: "code",
              width: 140,
              render: (text, record) => ((record as any).isSummaryRow ? "" : text),
            },
            {
              title: "Thời gian",
              dataIndex: "time",
              key: "time",
              width: 160,
              render: (d: Date, record) => ((record as any).isSummaryRow ? "" : dayjs(d).format("DD/MM/YYYY HH:mm")),
            },
            {
              title: "Nhà cung cấp",
              dataIndex: "supplierName",
              key: "supplierName",
              width: 220,
              render: (t?: string, record?: any) => ((record as any)?.isSummaryRow ? "" : t || "-"),
            },
            {
              title: "Đã trả NCC",
              dataIndex: "needPay",
              key: "needPay",
              width: 140,
              render: (v?: number, record?: any) => {
                if ((record as any)?.isSummaryRow) {
                  return <TotalPaymentSummaryCell receiptIds={filtered.map((r) => r.id)} />;
                }
                return (v ?? 0).toLocaleString();
              },
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              key: "status",
              width: 140,
              render: (s: Receipt["status"], record?: any) => {
                if ((record as any)?.isSummaryRow) return "";
                return <Tag color={statusColors[s]}>{statusLabels[s]}</Tag>;
              },
            },
          ]}
          dataSource={tableData as any}
          loading={loading}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record: any) => {
              if (record.isSummaryRow) return null;
              return (
                <ReceiptRowDetail
                  record={record}
                  refreshToken={refreshToken}
                  onEdit={() => setEditingId(record.id)}
                  onCancelled={load}
                />
              );
            },
            onExpand: (expanded, record: any) => {
              if (record.isSummaryRow) return false;
            },
          }}
          pagination={false}
        />
      </div>

      <CreateEditStockInDrawer
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
        }}
        onChanged={() => {
          setRefreshToken((x) => x + 1);
          load();
        }}
        receiptId={editingId ?? undefined}
      />

      <CreateNewProductDrawer
        open={openProductDrawer}
        onClose={() => setOpenProductDrawer(false)}
        title="Thêm sản phẩm mới"
      />
    </section>
  );
};

export default StockInPage;

const ReceiptRowDetail = ({ record, refreshToken, onEdit, onCancelled }: { record: any; refreshToken: number; onEdit: () => void; onCancelled: () => void }) => {
  const [detail, setDetail] = React.useState<any | null>(null);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const run = async () => {
      try {
        const res = await receiptsService.detail(record.id);
        setDetail(res.data);
        setNote(res.data?.note || "");
      } catch {
        setDetail(null);
      }
    };
    run();
  }, [record?.id, refreshToken]);
  const methodLabel = React.useMemo(() => {
    const m = detail?.paymentMethod || record?.paymentMethod;
    return m === "transfer" ? "Chuyển khoản" : "Tiền mặt";
  }, [detail?.paymentMethod, record?.paymentMethod]);
  const paymentsRows = React.useMemo(() => {
    if (!detail) return [] as any[];
    const paymentStatus = detail.status === 1 ? "Đã thanh toán" : detail.status === 2 ? "Đã hủy" : "Chưa thanh toán";
    return [
      {
        code: detail.code,
        time: dayjs(detail.receiptTime).format("DD/MM/YYYY HH:mm"),
        method:
          methodLabel +
          (detail.paymentMethod === "transfer"
            ? ` (${detail.supplierBankAccountNumber || "-"}${detail.supplierBankAccountName ? ` - ${detail.supplierBankAccountName}` : ""}${detail.supplierBankName ? ` - ${detail.supplierBankName}` : ""})`
            : ""),
        status: paymentStatus,
        amount: (detail.paymentAmount ?? 0).toLocaleString(),
      },
    ];
  }, [detail, methodLabel]);

  const paymentSummary = React.useMemo(() => {
    const items = (detail?.items || []) as any[];
    const totalAmount = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.costPrice || 0), 0);
    const discount = Number(detail?.discount || 0);
    const needPay = Math.max(0, totalAmount - discount);
    const paid = Number(detail?.paymentAmount || 0);
    const debt = Math.max(0, needPay - paid);
    return { totalAmount, discount, needPay, paid, debt };
  }, [detail?.items, detail?.discount, detail?.paymentAmount]);

  const handleSaveNote = async () => {
    if (!detail) return;
    try {
      setSaving(true);

      // Phiếu tạm: cập nhật toàn bộ thông tin
      if (detail.status === 0) {
        // Draft
        const updatePayload: CreateReceiptRequest = {
          supplierId: detail.supplierId,
          receiptTime: detail.receiptTime,
          paymentMethod: detail.paymentMethod,
          discount: detail.discount,
          paymentAmount: detail.paymentAmount,
          supplierBankAccountId: detail.supplierBankAccountId,
          note: note,
          complete: false, // Phiếu tạm
          items: detail.items?.map((i: any) => ({ productId: i.productId, quantity: i.quantity, costPrice: i.costPrice })) || [],
        };
        await receiptsService.update(record.id, updatePayload);
      } else {
        // Phiếu hoàn thành/hủy: chỉ cập nhật ghi chú
        await receiptsService.updateNote(record.id, note);
      }

      message.success("Đã lưu ghi chú thành công");

      // Reload detail to get updated note
      const res = await receiptsService.detail(record.id);
      setDetail(res.data);
      setNote(res.data?.note || ""); // Cập nhật note state với giá trị mới
    } catch (e: any) {
      message.error(e?.message || "Lưu ghi chú thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3">
      <Tabs
        defaultActiveKey="info"
        items={[
          {
            key: "info",
            label: "Thông tin",
            children: (
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold">Thông tin phiếu nhập</h3>
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
                      <div className="text-gray-500">Đã trả NCC:</div>
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
                    <div className="md:col-span-3">
                      <div className="mb-2 text-gray-500">Ghi chú:</div>
                      <Input.TextArea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Nhập ghi chú..."
                        rows={3}
                        className="mb-2"
                      />
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
                              content: "Bạn có chắc chắn muốn hủy phiếu nhập này?",
                              okText: "Hủy phiếu",
                              cancelText: "Đóng",
                              okButtonProps: { danger: true },
                              onOk: async () => {
                                try {
                                  await receiptsService.cancel(record.id);
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
                </div>

                {/* Sản phẩm */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold">Sản phẩm</h3>
                  <ReceiptProducts receiptId={record.id} refreshToken={refreshToken} />
                </div>

                {/* Thông tin thanh toán */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold">Thông tin thanh toán</h3>
                  <div className="space-y-1 text-right">
                    <div>
                      <span className="text-gray-600">Tổng tiền hàng</span>
                      <span className="ml-2 font-semibold">{paymentSummary.totalAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Giảm giá phiếu nhập</span>
                      <span className="ml-2 font-semibold">{paymentSummary.discount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Cần trả NCC</span>
                      <span className="ml-2 font-semibold">{paymentSummary.needPay.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tiền đã trả NCC</span>
                      <span className="ml-2 font-semibold text-green-600">{paymentSummary.paid.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Còn nợ NCC</span>
                      <span className="ml-2 font-semibold text-red-600">{paymentSummary.debt.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ),
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
                      render: (t: string) => <Tag color={t === "Đã thanh toán" ? "green" : "red"}>{t}</Tag>,
                    },
                    { title: "Tiền chi", dataIndex: "amount", key: "amount", width: 140 },
                  ]}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

const ReceiptProducts = ({ receiptId, refreshToken }: { receiptId: number; refreshToken: number }) => {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await receiptsService.detail(receiptId);
        const d = res.data;
        setRows(
          (d?.items || []).map((i) => ({
            code: i.productCode || i.productId,
            name: i.productName || "",
            quantity: i.quantity,
            costPrice: i.costPrice,
            amount: (i.quantity || 0) * (i.costPrice || 0),
          })),
        );
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [receiptId, refreshToken]);
  return (
    <div className="max-h-96 overflow-y-auto">
      <Table
        size="small"
        bordered
        loading={loading}
        rowKey={(r) => String((r as any).code) + String((r as any).name)}
        dataSource={rows}
        pagination={false}
        scroll={{ x: "max-content" }}
        columns={[
          { title: "Mã hàng", dataIndex: "code", key: "code", width: 140 },
          { title: "Tên hàng", dataIndex: "name", key: "name", width: 220 },
          { title: "SL nhập", dataIndex: "quantity", key: "quantity", width: 120 },
          { title: "Giá vốn", dataIndex: "costPrice", key: "costPrice", width: 140, render: (v) => (v ?? 0).toLocaleString() },
          { title: "Thành tiền", dataIndex: "amount", key: "amount", width: 160, render: (v) => (v ?? 0).toLocaleString() },
        ]}
        locale={{ emptyText: "Chưa có sản phẩm" }}
      />
    </div>
  );
};
