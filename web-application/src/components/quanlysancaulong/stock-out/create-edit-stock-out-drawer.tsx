"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, DatePicker, Drawer, Form, Input, InputNumber, Row, Space, Table, message, Checkbox, List, Image, Select, Modal } from "antd";
import { CloseOutlined, SaveOutlined, SearchOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import { useListCategories } from "@/hooks/useCategories";
import { useListSuppliers } from "@/hooks/useSuppliers";
import { stockOutService } from "@/services/stockOutService";
import { CreateStockOutRequest } from "@/types-openapi/api";
import { useQueryClient } from "@tanstack/react-query";

type StockOutItem = {
  productId: number;
  code: string;
  name: string;
  quantity: number;
  costPrice: number;
  lineTotal: number;
  note?: string;
  images?: string[];
  stock: number; // Thêm thông tin tồn kho
};


interface Props {
  open: boolean;
  onClose: () => void;
  stockOutId?: number;
  onChanged?: () => void;
}

const CreateEditStockOutDrawer: React.FC<Props> = ({ open, onClose, stockOutId, onChanged }) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const { data: categoriesData } = useListCategories({});
  const { data: suppliersData } = useListSuppliers({});
  const queryClient = useQueryClient();

  const isEdit = !!stockOutId;
  const [items, setItems] = useState<StockOutItem[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // categories filter
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectAllCategories, setSelectAllCategories] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset all filter states when closing
      setQuery("");
      setDebouncedQuery("");
      setSelectedCategories([]);
      setSelectAllCategories(false);
      setProductsWithImages([]);
      return;
    }
    if (!isEdit) {
      form.resetFields();
      setItems([]);
      form.setFieldsValue({ 
        outTime: dayjs(),
        outBy: user?.fullName || user?.userName || user?.email || "Người dùng"
      });
      return;
    }
    // Edit mode: load detail
    (async () => {
      try {
        if (!stockOutId) return;
        const res = await stockOutService.detail(stockOutId);
        const d = res.data as any;
        form.setFieldsValue({
          outTime: d?.outTime ? dayjs(d.outTime) : dayjs(),
          supplierId: d?.supplierId,
          outBy: d?.outBy,
          note: d?.note,
        });
        const loadedItems: StockOutItem[] = await Promise.all((d?.items || []).map(async (i: any) => {
          // Lấy thông tin stock từ productService.detail()
          let stock = 0;
          try {
            const svc = await import("@/services/productService");
            const productDetail = await svc.productService.detail({ id: i.productId } as any);
            stock = (productDetail as any)?.data?.stock ?? 0;
            console.log(`Load stock-out item ${i.productName} (${i.productId}) stock:`, stock); // Debug log
          } catch (error) {
            console.log(`Error getting stock for stock-out item ${i.productName} (${i.productId}):`, error); // Debug log
          }
          
          return {
            productId: i.productId,
            code: i.productCode || String(i.productId),
            name: i.productName || "",
            quantity: i.quantity,
            costPrice: i.costPrice,
            lineTotal: Number(i.quantity) * Number(i.costPrice || 0),
            note: i.note,
            stock: stock, // Sử dụng stock từ API
          };
        }));
        setItems(loadedItems);
      } catch (e: any) {
        message.error(e?.message || "Tải phiếu thất bại");
      }
    })();
  }, [open, isEdit, form, stockOutId, user?.email, user?.fullName, user?.userName]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 120);
    return () => clearTimeout(t);
  }, [query]);

  // search products
  const [productsWithImages, setProductsWithImages] = useState<any[]>([]);
  useEffect(() => {
    const run = async () => {
      if (!debouncedQuery) { setProductsWithImages([]); return; }
      try {
        const svc = await import("@/services/productService");
        const res = await svc.productService.list({ name: debouncedQuery } as any);
        const list: any[] = (res as any)?.data || [];
        const detailWithImages = await Promise.all(list.slice(0, 6).map(async (p: any) => {
            try {
              const d = await svc.productService.detail({ id: p.id } as any);
              const stock = (d as any)?.data?.stock ?? 0;
              console.log(`Stock-out search product ${p.name} (${p.id}) stock:`, stock); // Debug log
              return { ...p, images: (d as any)?.data?.images || [], costPrice: (d as any)?.data?.costPrice ?? 0, stock: stock };
            } catch (error) {
              console.log(`Error getting stock for stock-out product ${p.name} (${p.id}):`, error); // Debug log
              return { ...p, images: [], costPrice: 0, stock: 0 };
            }
        }));
        setProductsWithImages(detailWithImages);
      } catch {
        setProductsWithImages([]);
      }
    };
    run();
  }, [debouncedQuery]);

  // Auto add products when selecting categories
  useEffect(() => {
    const run = async () => {
      try {
        const svc = await import("@/services/productService");
        let categoryNames: string[] = selectedCategories;
        if (selectAllCategories && (categoriesData?.data?.length || 0) > 0) {
          categoryNames = (categoriesData?.data || []).map((c: any) => c.name as string);
        }
        const queries = categoryNames.length > 0 ? categoryNames : [];
        for (const catName of queries) {
          const res = await svc.productService.list({ category: catName } as any);
          const list: any[] = res.data || [];
          for (const p of list.slice(0, 10)) {
            try {
              const d = await svc.productService.detail({ id: p.id } as any);
              const cost = (d as any)?.data?.costPrice ?? 0;
              const stock = (d as any)?.data?.stock ?? 0;
              console.log(`Stock-out auto-add product ${p.name} (${p.id}) stock:`, stock); // Debug log
              const newItem: StockOutItem = { productId: p.id, code: p.code || String(p.id), name: p.name, quantity: 1, costPrice: cost, lineTotal: cost, note: "", stock: stock };
              setItems((prev) => (prev.some(x => x.productId === p.id) ? prev : [...prev, newItem]));
            } catch (error) {
              console.log(`Error auto-adding stock-out product ${p.name} (${p.id}):`, error); // Debug log
              const newItem: StockOutItem = { productId: p.id, code: p.code || String(p.id), name: p.name, quantity: 1, costPrice: 0, lineTotal: 0, note: "", stock: 0 };
              setItems((prev) => (prev.some(x => x.productId === p.id) ? prev : [...prev, newItem]));
            }
          }
        }
      } catch {}
    };
    if (selectedCategories.length > 0 || selectAllCategories) run();
  }, [selectedCategories, selectAllCategories, categoriesData?.data]);

  const onSelectProduct = (p: any) => {
    const id = p.id as number;
    const cost = p.costPrice ?? 0;
    const stock = p.stock ?? 0;
    console.log(`Stock-out click product ${p.name} (${id}) stock:`, stock); // Debug log
    const newItem: StockOutItem = {
      productId: id,
      code: p.code || String(id),
      name: p.name,
      quantity: 1,
      costPrice: cost,
      lineTotal: cost,
      note: "",
      images: p.images || [],
      stock: stock,
    };
    setItems(prev => (prev.some(x => x.productId === id) ? prev : [...prev, newItem]));
  };

  const updateQuantity = (productId: number, q: number) => {
    const quantity = Math.max(0, Number(q) || 0);
    const item = items.find(i => i.productId === productId);
    
    // Validation đơn giản: không cho nhập vượt quá tồn kho
    if (item && quantity > item.stock) {
      return; // Không cập nhật, không hiện message
    }
    
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity, lineTotal: quantity * (i.costPrice ?? 0) } : i));
  };

  const updateCost = (productId: number, c: number) => {
    const cost = Math.max(0, Number(c) || 0);
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, costPrice: cost, lineTotal: cost * (i.quantity ?? 0) } : i));
  };

  const updateNote = (productId: number, note: string) => {
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, note } : i));
  };

  const removeItem = (productId: number) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const removeAllItems = () => {
    Modal.confirm({
      title: "Xác nhận",
      content: "Xóa tất cả sản phẩm khỏi danh sách xuất hủy?",
      okText: "Xóa tất cả",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: () => {
        setItems([]);
      },
    });
  };

  const columns: TableColumnsType<StockOutItem> = [
    { title: "Mã hàng", dataIndex: "code", key: "code", width: 140 },
    { title: "Tên hàng", dataIndex: "name", key: "name", width: 220 },
    { title: "Tồn kho", dataIndex: "stock", key: "stock", width: 100, render: (v: number) => (v ?? 0).toLocaleString() },
    {
      title: "SL hủy",
      key: "quantity",
      width: 120,
      render: (_, r) => (
        <InputNumber 
          min={0} 
          value={r.quantity} 
          onChange={(val) => updateQuantity(r.productId, Number(val))} 
          style={{ width: 100 }} 
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
        />
      ),
    },
    {
      title: "Giá vốn",
      key: "costPrice",
      width: 120,
      render: (_, r) => (
        <InputNumber 
          min={0} 
          value={r.costPrice} 
          onChange={(val) => updateCost(r.productId, Number(val))} 
          style={{ width: 120 }} 
          disabled 
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
        />
      ),
    },
    {
      title: "Ghi chú",
      key: "note",
      width: 200,
      render: (_, r) => (
        <Input value={r.note || ""} onChange={(e) => updateNote(r.productId, e.target.value)} placeholder="Ghi chú..." />
      ),
    },
    { title: "Giá trị hủy", dataIndex: "lineTotal", key: "lineTotal", width: 140, render: (v) => (v ?? 0).toLocaleString() },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, r) => (
        <Button danger size="small" onClick={(e) => { e.stopPropagation(); removeItem(r.productId); }}>Xóa</Button>
      ),
    },
  ];

  const totals = useMemo(() => {
    const totalQuantity = items.reduce((s, i) => s + (i.quantity ?? 0), 0);
    const totalValue = items.reduce((s, i) => s + (i.lineTotal ?? 0), 0);
    return { totalQuantity, totalValue };
  }, [items]);

  const doSave = async (complete: boolean) => {
    const values = form.getFieldsValue();
    
    // Validate supplier selection
    if (!values.supplierId) {
      message.warning("Vui lòng chọn nhà cung cấp");
      return;
    }
    
    if ((items || []).length === 0) {
      message.warning("Vui lòng thêm sản phẩm");
      return;
    }

    // Validate stock quantity - đơn giản
    const invalidItems = items.filter(item => item.quantity > item.stock);
    if (invalidItems.length > 0) {
      message.error("Số lượng xuất hủy không được vượt quá tồn kho");
      return;
    }

    try {
      const payload: CreateStockOutRequest = {
        outTime: new Date(((values.outTime ? dayjs(values.outTime) : dayjs()).toDate()).toISOString()),
        supplierId: values.supplierId,
        outBy: values.outBy || undefined,
        note: values.note || undefined,
        complete,
        items: items.map((i) => ({ 
          productId: i.productId, 
          quantity: i.quantity, 
          costPrice: i.costPrice,
          note: i.note || undefined
        })),
      };

      if (isEdit) {
        if (complete) {
          await stockOutService.complete(stockOutId!);
          message.success("Đã hoàn thành phiếu xuất hủy");
          try { await queryClient.invalidateQueries({ queryKey: ["products"] }); } catch {}
        } else {
          await stockOutService.update(stockOutId!, payload);
          message.success("Đã lưu nháp phiếu xuất hủy");
        }
      } else {
        await stockOutService.create(payload);
        message.success(complete ? "Đã hoàn thành phiếu xuất hủy" : "Đã lưu nháp phiếu xuất hủy");
        if (complete) { try { await queryClient.invalidateQueries({ queryKey: ["products"] }); } catch {} }
      }
      
      // Reset all filter states
      setQuery("");
      setDebouncedQuery("");
      setSelectedCategories([]);
      setSelectAllCategories(false);
      setProductsWithImages([]);
      
      try { onChanged?.(); } catch {}
      onClose();
    } catch (e: any) {
      message.error(e?.message || "Lưu phiếu xuất hủy thất bại");
    }
  };

  const onSave = (complete: boolean) => {
    if (complete) {
      Modal.confirm({
        title: "Xác nhận hoàn thành",
        content: "Bạn có chắc chắn muốn hoàn thành phiếu xuất hủy?",
        okText: "Hoàn thành",
        cancelText: "Đóng",
        onOk: () => doSave(true),
      });
    } else {
      Modal.confirm({
        title: "Xác nhận lưu nháp",
        content: "Bạn có chắc chắn muốn lưu nháp phiếu xuất hủy?",
        okText: "Lưu nháp",
        cancelText: "Đóng",
        onOk: () => doSave(false),
      });
    }
  };

  return (
    <Drawer
      title={isEdit ? "Chỉnh sửa phiếu xuất hủy" : "Thêm phiếu xuất hủy"}
      width={1000}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 160 } }}
      footer={
        <div className="text-right">
          <Space>
            <Button onClick={onClose} icon={<CloseOutlined />}>Đóng</Button>
            {!isEdit ? (
              <>
                <Button type="default" onClick={() => onSave(false)} icon={<SaveOutlined />}>Lưu nháp</Button>
                <Button type="primary" onClick={() => onSave(true)} icon={<SaveOutlined />}>Hoàn thành</Button>
              </>
            ) : (
              <>
                <Button type="default" onClick={() => onSave(false)} icon={<SaveOutlined />}>Lưu</Button>
                <Button type="primary" onClick={() => onSave(true)} icon={<SaveOutlined />}>Hoàn thành</Button>
              </>
            )}
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ 
        outTime: dayjs(),
        outBy: user?.fullName || user?.userName || user?.email || "Người dùng"
      }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="outTime" label="Ngày xuất hủy" rules={[{ required: true, message: "Vui lòng chọn ngày" }]}> 
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" allowClear={false} disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true, message: "Vui lòng chọn nhà cung cấp" }]}>
              <Select
                allowClear
                showSearch
                placeholder="Chọn nhà cung cấp"
                optionFilterProp="label"
                options={suppliersData?.data?.map(s => ({ value: s.id, label: s.name })) || []}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="outBy" label="Người xuất hủy">
              <Input placeholder="Nhập người xuất hủy" disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12} align="middle">
          <Col span={24}>
            <div className="mb-2 font-semibold">Thêm sản phẩm</div>
            <div className="flex gap-3 items-center mb-2">
              <Input placeholder="Tìm kiếm sản phẩm..." prefix={<SearchOutlined />} value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: 1 }} />
              <div style={{ minWidth: 260 }}>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: "100%" }}
                  placeholder="Chọn nhóm hàng "
                  value={selectedCategories}
                  onChange={(vals) => setSelectedCategories(vals as string[])}
                  options={(categoriesData?.data || []).map((c: any) => ({ label: c.name, value: c.name }))}
                />
              </div>
              <Checkbox checked={selectAllCategories} onChange={(e) => setSelectAllCategories(e.target.checked)}>Tất cả nhóm</Checkbox>
            </div>

            {debouncedQuery && productsWithImages.length > 0 && (
              <Card size="small" className="mb-2">
                <List
                  size="small"
                  dataSource={productsWithImages}
                  renderItem={(product: any) => (
                    <List.Item
                      className="cursor-pointer hover:bg-gray-50 p-3 rounded border-b border-gray-100"
                      onClick={() => onSelectProduct(product)}
                    >
                      <div className="flex items-center w-full">
                        <div className="mr-3">
                          {product.images && product.images.length > 0 ? (
                            <Image width={60} height={60} src={product.images[0]} alt={product.name} style={{ objectFit: "contain", borderRadius: 8 }} />
                          ) : (
                            <div className="flex items-center justify-center bg-gray-100 text-gray-400 text-xs" style={{ width: 60, height: 60, borderRadius: 8 }}>No Image</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-base mb-1">{product.name}</div>
                          <div className="text-sm text-gray-600"><span className="font-medium">Mã:</span> {product.code || product.id}</div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </Col>
        </Row>

        {items.length > 0 && (
          <div className="mb-2 text-right">
            <Space>
              <Button danger onClick={removeAllItems}>Xóa tất cả</Button>
            </Space>
          </div>
        )}

        <Table<StockOutItem>
          size="small"
          rowKey={(r) => r.productId}
          columns={columns}
          dataSource={items}
          pagination={false}
        />

        <Card className="mt-3" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="note" label="Ghi chú">
                <Input.TextArea rows={4} placeholder="Nhập ghi chú" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-600">Tổng số lượng</span><span className="font-semibold">{totals.totalQuantity}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Tổng giá trị hủy</span><span className="font-semibold">{totals.totalValue.toLocaleString()}</span></div>
              </div>
            </Col>
          </Row>
        </Card>
      </Form>

      <div className="text-sm text-gray-500 mt-4">
        <p>Lưu ý:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Mã phiếu xuất hủy sẽ được hệ thống sinh tự động.</li>
          <li>Lưu nháp: Phiếu tạm; Hoàn thành: chốt phiếu và cập nhật tồn kho.</li>
          <li>Khi hoàn thành, hệ thống sẽ tự động tạo thẻ kho xuất hủy và kiểm kho.</li>
        </ul>
      </div>
    </Drawer>
  );
};

export default CreateEditStockOutDrawer;
