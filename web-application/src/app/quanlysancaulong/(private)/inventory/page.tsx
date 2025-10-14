"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Breadcrumb, Button, Table, Space, Tag, Card, Form, Input, DatePicker, Modal, Row, Col, Checkbox, Spin, message, Tabs } from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined, CalendarOutlined, FileTextOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { ColumnsType, TableProps } from "antd/es/table";
import type { InventoryCheck, InventoryCheckStatus, InventoryCheckItemResponse } from "@/types-openapi/api";
import { useListInventoryChecks, useDeleteInventoryCheck, useDetailInventoryCheck, useMergeInventoryChecks } from "@/hooks/useInventory";
import CreateEditInventoryDrawer from "@/components/quanlysancaulong/inventory/create-edit-inventory-drawer";


// Inventory status mapping
const statusColors = {
  0: "orange", // Chờ kiểm kê
  1: "green", // Đã hoàn thành
  2: "red", // Đã hủy
} as const;

const statusLabels = {
  0: "Phiếu tạm",
  1: "Đã cân bằng kho",
  2: "Đã hủy",
} as const;

type SearchValues = {
  code?: string;
  productQuery?: string;
  statuses?: number[]; // multi-select via checkboxes
  range?: [dayjs.Dayjs, dayjs.Dayjs];
};

const tableProps: TableProps<InventoryCheck> = {
  rowKey: "id",
  size: "small",
  scroll: { x: "max-content" },
  bordered: true,
};

const InventoryManagementPage = () => {
  const [searchForm] = Form.useForm<SearchValues>();
  const [searchValues, setSearchValues] = useState<SearchValues>({
    statuses: [0, 1],
    range: [dayjs().startOf("month"), dayjs().endOf("month")],
  });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [, contextHolder] = Modal.useModal();
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeData, setMergeData] = useState<any[]>([]);

  // Use hooks for data fetching
  const { data, isLoading, refetch } = useListInventoryChecks({});
  const mergeMutation = useMergeInventoryChecks();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [productMatchIds, setProductMatchIds] = useState<Set<number> | null>(null);
  const [debouncedProductQuery, setDebouncedProductQuery] = useState<string>("");

  // Auto refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Open drawer when editingId changes
  useEffect(() => {
    if (editingId !== null) {
      setOpen(true);
    }
  }, [editingId]);

  // Helper functions
  const onCreate = () => {
    setEditingId(null);
    setOpen(true);
  };

  // Fetch merge data for selected checks
  const fetchMergeData = async (ids: number[]) => {
    try {
      const details = await Promise.all(
        ids.map(async (id) => {
          const response = await (await import("@/services/inventoryService")).inventoryService.detail(id);
          return response.data;
        })
      );
      
      // Combine all items from selected checks
      const allItems: any[] = [];
      details.forEach((check, index) => {
        if (check?.items) {
          check.items.forEach((item: any) => {
            allItems.push({
              ...item,
              checkCode: check.code,
              checkIndex: index + 1
            });
          });
        }
      });
      
      setMergeData(allItems);
      setMergeModalOpen(true);
    } catch {
      message.error("Không thể tải dữ liệu để gộp phiếu");
    }
  };

  // derive active date range from search values
  const resolvedRange = useMemo(() => {
    if (searchValues.range && searchValues.range.length === 2) {
      return searchValues.range;
    }

    // Default to current month if no range is selected
    const start = dayjs().startOf("month");
    const end = dayjs().endOf("month");
    return [start, end] as [dayjs.Dayjs, dayjs.Dayjs];
  }, [searchValues.range]);

  // Filter data based on search values
  const filteredData = useMemo(() => {
    const listData = data?.data ?? [];
    const code = (searchValues.code || "").trim().toLowerCase();
    const productQuery = (searchValues.productQuery || "").trim().toLowerCase();
    const statuses = searchValues.statuses && searchValues.statuses.length > 0 ? new Set(searchValues.statuses) : undefined;
    const range = resolvedRange;

    return listData.filter((x) => {
      const okCode = !code || (x.code || "").toLowerCase().includes(code);
      const okProduct = !productQuery || (productMatchIds?.has((x.id as number) || -1) ?? false);
      const okStatus = !statuses || statuses.has((x.status as number) ?? -1);

      if (!range) return okCode && okProduct && okStatus;

      const from = range[0]?.startOf("day");
      const to = range[1]?.endOf("day");
      const checkTime = x.checkTime ? dayjs(x.checkTime) : null;
      const okTime = !checkTime || (checkTime.isAfter(from) && checkTime.isBefore(to));

      return okCode && okProduct && okStatus && okTime;
    });
  }, [data?.data, searchValues, resolvedRange, productMatchIds]);

  // Debounce productQuery
  useEffect(() => {
    const t = setTimeout(() => setDebouncedProductQuery((searchValues.productQuery || "").trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [searchValues.productQuery]);

  // Build productMatchIds by fetching details and checking items
  useEffect(() => {
    const run = async () => {
      const listData = data?.data ?? [];
      const q = debouncedProductQuery;
      if (!q) { setProductMatchIds(null); return; }
      try {
        // Limit to current filtered by basic conditions (code/status/time) to reduce requests
        const code = (searchValues.code || "").trim().toLowerCase();
        const statuses = searchValues.statuses && searchValues.statuses.length > 0 ? new Set(searchValues.statuses) : undefined;
        const range = resolvedRange;
        const prelim = listData.filter((x) => {
          const okCode = !code || (x.code || "").toLowerCase().includes(code);
          const okStatus = !statuses || statuses.has((x.status as number) ?? -1);
          const from = range?.[0]?.startOf("day");
          const to = range?.[1]?.endOf("day");
          const checkTime = x.checkTime ? dayjs(x.checkTime) : null;
          const okTime = !checkTime || (checkTime.isAfter(from) && checkTime.isBefore(to));
          return okCode && okStatus && okTime;
        });

        const svc = (await import("@/services/inventoryService")).inventoryService;
        const chunks: any[][] = [];
        const ids = prelim.map(p => p.id as number).filter(Boolean);
        const concurrency = 5;
        for (let i = 0; i < ids.length; i += concurrency) chunks.push(ids.slice(i, i + concurrency));
        const matched = new Set<number>();
        for (const batch of chunks) {
          const results = await Promise.all(batch.map(async (id) => {
            try { const res = await svc.detail(id); return { id, data: res.data }; } catch { return { id, data: null }; }
          }));
          for (const r of results) {
            const items = (r.data?.items || []) as any[];
            if (items.some(it => (String(it.productCode || "").toLowerCase().includes(q)) || (String(it.productName || "").toLowerCase().includes(q)))) {
              matched.add(r.id);
            }
          }
        }
        setProductMatchIds(matched);
      } catch {
        setProductMatchIds(new Set<number>());
      }
    };
    run();
  }, [debouncedProductQuery, data?.data, resolvedRange, searchValues.code, searchValues.statuses]);

  const columns: ColumnsType<
    InventoryCheck & { totalDelta?: number; balancedAt?: Date; totalDeltaIncrease?: number; totalDeltaDecrease?: number; note?: string }
  > = [
    {
      title: "Mã kiểm kê",
      dataIndex: "code",
      key: "code",
      width: 120,
    },
    {
      title: "Thời gian",
      dataIndex: "checkTime",
      key: "checkTime",
      width: 160,
      render: (date: Date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-"),
    },
    {
      title: "Ngày cân bằng",
      dataIndex: "balancedAt",
      key: "balancedAt",
      width: 160,
      render: (date?: Date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-"),
    },
    {
      title: "Tổng chênh lệch",
      dataIndex: "totalDelta",
      key: "totalDelta",
      width: 140,
      render: (n?: number) => (typeof n === "number" ? n : 0),
    },
    {
      title: "SL lệch tăng",
      dataIndex: "totalDeltaIncrease",
      key: "totalDeltaIncrease",
      width: 120,
      render: (n?: number) => (typeof n === "number" ? n : 0),
    },
    {
      title: "SL lệch giảm",
      dataIndex: "totalDeltaDecrease",
      key: "totalDeltaDecrease",
      width: 120,
      render: (n?: number) => (typeof n === "number" ? n : 0),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
      width: 300,
      render: (t?: string) => t || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: InventoryCheckStatus) => <Tag color={statusColors[status ?? 0]}>{statusLabels[status ?? 0]}</Tag>,
    },
  ];

  const onSearchSubmit = (vals: SearchValues) => {
    setSearchValues({
      ...searchValues,
      ...vals,
    });
  };

  const onSearchReset = () => {
    searchForm.resetFields();
    setSearchValues({
      statuses: [0, 1],
      range: [dayjs().startOf("month"), dayjs().endOf("month")],
    });
  };


  return (
    <section>
      {contextHolder}
      <div className="mb-3">
        <Breadcrumb items={[{ title: "Quản lý kho" }, { title: "Kiểm kê kho" }]} />
      </div>

      {/* Filters - product-style Card layout with current fields */}
      <Form form={searchForm} layout="vertical" onFinish={onSearchSubmit} initialValues={searchValues}>
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
          <Row gutter={16}>
            <Col span={5}>
              <Form.Item name="code" label="Theo mã phiếu kiểm">
                <Input allowClear placeholder="Theo mã phiếu kiểm" />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="productQuery" label="Theo mã, tên hàng">
                <Input allowClear placeholder="Theo mã, tên hàng" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Trạng thái" name="statuses">
                <Checkbox.Group 
                  style={{ width: "100%" }}
                  onChange={(values) => {
                    setSearchValues(prev => ({ ...prev, statuses: values as number[] }));
                  }}
                >
                  <Row gutter={[0, 8]}>
                    <Col span={24}>
                      <Checkbox value={0}>Phiếu tạm</Checkbox>
                    </Col>
                    <Col span={24}>
                      <Checkbox value={1}>Đã cân bằng kho</Checkbox>
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
                  <DatePicker.RangePicker style={{ width: 280 }} suffixIcon={<CalendarOutlined />} />
                </Form.Item>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>

      <div className="mt-2 flex items-center justify-between">
        <div>
          <span className="font-bold text-green-500">Tổng số: {filteredData.length}</span>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={selectedRowKeys.length < 2}
            onClick={() => {
              const ids = filteredData.filter(x => selectedRowKeys.includes(x.id as any) && (x.status as any) === 0).map(x => x.id!);
              if (ids.length < 2) { message.warning("Chỉ gộp được các phiếu tạm"); return; }
              // Fetch details for selected checks
              fetchMergeData(ids);
            }}
          >
            Gộp phiếu
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Tải lại
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Thêm phiếu kiểm kê
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Table<any>
          {...tableProps}
          columns={columns as any}
          dataSource={filteredData as any}
          loading={isLoading}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys as any }}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => <InventoryRowDetail id={(record as any).id} onEdit={setEditingId} />,
          }}
        />
      </div>

      <CreateEditInventoryDrawer open={open} onClose={() => { setOpen(false); setEditingId(null); }} inventoryId={editingId ?? undefined} />
      
      {/* Merge Confirmation Modal */}
      <Modal
        title="Gộp phiếu kiểm kho"
        open={mergeModalOpen}
        onCancel={() => setMergeModalOpen(false)}
        width={800}
        footer={null}
      >
        <div className="space-y-4">
          {/* Summary Table */}
          <Table
            size="small"
            dataSource={mergeData}
            pagination={false}
            scroll={{ y: 300 }}
            rowKey="productId"
            columns={[
              {
                title: "Mã hàng hóa",
                dataIndex: "productCode",
                key: "productCode",
                width: 120,
              },
              {
                title: "Tên hàng",
                dataIndex: "productName", 
                key: "productName",
                width: 200,
              },
              {
                title: "Tồn kho",
                dataIndex: "systemQuantity",
                key: "systemQuantity",
                width: 100,
                align: "right",
              },
              {
                title: "Thực tế",
                dataIndex: "actualQuantity",
                key: "actualQuantity", 
                width: 100,
                align: "right",
              },
              {
                title: "SL lệch",
                key: "discrepancy",
                width: 100,
                align: "right",
                render: (_, record) => (record.actualQuantity - record.systemQuantity),
              },
            ]}
          />
          
          {/* Summary Statistics */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Số lượng lệch tăng:</span>
              <span className="text-green-600 font-semibold">
                {mergeData.reduce((sum, item) => {
                  const diff = item.actualQuantity - item.systemQuantity;
                  return sum + (diff > 0 ? diff : 0);
                }, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Số lượng lệch giảm:</span>
              <span className="text-red-600 font-semibold">
                {Math.abs(mergeData.reduce((sum, item) => {
                  const diff = item.actualQuantity - item.systemQuantity;
                  return sum + (diff < 0 ? diff : 0);
                }, 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tổng thực tế:</span>
              <span className="font-semibold">
                {mergeData.reduce((sum, item) => sum + item.actualQuantity, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tổng chênh lệch:</span>
              <span className="font-semibold">
                {mergeData.reduce((sum, item) => sum + (item.actualQuantity - item.systemQuantity), 0)}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => setMergeModalOpen(false)}>
              Bỏ qua
            </Button>
            <Button 
              type="primary" 
              icon={<FileTextOutlined />}
              onClick={() => {
                const ids = filteredData.filter(x => selectedRowKeys.includes(x.id as any) && (x.status as any) === 0).map(x => x.id!);
                mergeMutation.mutate(ids);
                setMergeModalOpen(false);
              }}
              loading={mergeMutation.isPending}
            >
              Gộp phiếu
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

const InventoryRowDetail = ({ id, onEdit }: { id: number; onEdit: (id: number) => void }) => {
  const { data, isFetching } = useDetailInventoryCheck(id, true);
  const cancelMutation = useDeleteInventoryCheck();
  const d = data?.data;

  const items: InventoryCheckItemResponse[] = (d?.items as any) ?? [];
  const totalActual = items.reduce((s, i) => s + (i.actualQuantity ?? 0), 0);
  const totalInc = items.reduce((s, i) => s + Math.max(0, i.deltaQuantity ?? 0), 0);
  const totalDec = items.reduce((s, i) => s + Math.max(0, -(i.deltaQuantity ?? 0)), 0);
  const totalDelta = items.reduce((s, i) => s + (i.deltaQuantity ?? 0), 0);
  const totalDeltaValue = items.reduce((s, i) => s + (((i.actualQuantity ?? 0) - (i.systemQuantity ?? 0)) * ((i as any).costPrice ?? 0)), 0);

  if (isFetching) {
    return (
      <div className="py-6 text-center">
        <Spin />
      </div>
    );
  }

  const infoTab = (
    <div className="p-3">
      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <div>
          <div className="text-gray-500">Mã kiểm kho:</div>
          <div className="font-semibold">{d?.code}</div>
        </div>
        <div>
          <div className="text-gray-500">Trạng thái:</div>
          <div>
            <Tag color={statusColors[d?.status ?? 0]}>{statusLabels[d?.status ?? 0]}</Tag>
          </div>
        </div>
        <div>
          <div className="text-gray-500">Thời gian:</div>
          <div className="font-semibold">{d?.checkTime ? dayjs(d.checkTime).format("DD/MM/YYYY HH:mm") : "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Người tạo:</div>
          <div className="font-semibold">{(d as any)?.createdBy || "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Ngày cân bằng:</div>
          <div className="font-semibold">{(d as any)?.balancedAt ? dayjs((d as any).balancedAt).format("DD/MM/YYYY HH:mm") : "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">Ghi chú:</div>
          <div className="font-semibold">{d?.note || "-"}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-3 flex items-center justify-end gap-2">
        {d?.status === 0 && (
          <>
            <Button onClick={() => d?.id && onEdit(d.id)} type="primary">
              Cập nhật
            </Button>
            <Button danger onClick={() => {
              Modal.confirm({
                title: "Xác nhận hủy phiếu",
                content: "Bạn có chắc chắn muốn hủy phiếu kiểm kê này?",
                okText: "Hủy phiếu",
                cancelText: "Đóng",
                okButtonProps: { danger: true },
                onOk: () => d?.id && cancelMutation.mutate(d.id),
              });
            }} loading={cancelMutation.isPending}>
              Hủy phiếu
            </Button>
          </>
        )}
      </div>

      <Table<InventoryCheckItemResponse>
        size="small"
        rowKey={(r) => `${r.productCode}-${r.productName}`}
        columns={[
          { title: "Mã hàng hóa", dataIndex: "productCode", key: "productCode", width: 160 },
          { title: "Tên hàng", dataIndex: "productName", key: "productName", width: 240 },
          { title: "Tồn kho", dataIndex: "systemQuantity", key: "systemQuantity", width: 120 },
          { title: "Thực tế", dataIndex: "actualQuantity", key: "actualQuantity", width: 120 },
          { title: "SL lệch", dataIndex: "deltaQuantity", key: "deltaQuantity", width: 120 },
          { 
            title: "Giá trị chênh lệch", 
            key: "deltaValue", 
            width: 150,
            render: (_, record) => {
              const deltaValue = ((record.actualQuantity ?? 0) - (record.systemQuantity ?? 0)) * ((record as any).costPrice ?? 0);
              return (
                <span className={deltaValue >= 0 ? "text-green-600" : "text-red-600"}>
                  {deltaValue.toLocaleString()}
                </span>
              );
            }
          },
        ]}
        dataSource={items}
        pagination={false}
      />

      <div className="mt-4 space-y-2 text-right">
        <div>
          <span className="text-gray-600">Tổng thực tế</span> <span className="font-semibold">({totalActual})</span>
        </div>
        <div>
          <span className="text-gray-600">Tổng chênh lệch tăng</span> <span className="font-semibold">({totalInc})</span>
        </div>
        <div>
          <span className="text-gray-600">Tổng chênh lệch giảm</span> <span className="font-semibold">({totalDec})</span>
        </div>
        <div>
          <span className="text-gray-600">Tổng chênh lệch</span> <span className="font-semibold">({totalDelta})</span>
        </div>
        <div>
          <span className="text-gray-600">Giá trị chênh lệch</span> <span className="font-semibold">({totalDeltaValue.toLocaleString()})</span>
        </div>
      </div>
    </div>
  );

  return (
    <Tabs
      defaultActiveKey="info"
      items={[
        { key: "info", label: "Thông tin", children: infoTab },
      ]}
    />
  );
};

export default InventoryManagementPage;
