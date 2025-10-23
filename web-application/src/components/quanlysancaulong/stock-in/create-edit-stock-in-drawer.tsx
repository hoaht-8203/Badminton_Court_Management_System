"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Table,
  message,
  Checkbox,
  List,
  Image,
  Select,
  Modal,
} from "antd";
import { CloseOutlined, SaveOutlined, SearchOutlined, CreditCardOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import { useListSuppliers } from "@/hooks/useSuppliers";
import { useListCategories } from "@/hooks/useCategories";
import { supplierBankAccountsService } from "@/services/supplierBankAccountsService";
import { receiptsService } from "@/services/receiptsService";
import { CreateReceiptRequest } from "@/types-openapi/api";

type StockInItem = {
  productId: number;
  code: string;
  name: string;
  quantity: number;
  costPrice: number;
  lineTotal: number;
  images?: string[];
};

type SupplierBank = {
  id: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  receiptId?: number;
  onChanged?: () => void;
}

const CreateEditStockInDrawer: React.FC<Props> = ({ open, onClose, receiptId, onChanged }) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const { data: suppliers } = useListSuppliers({});
  const { data: categoriesData } = useListCategories({});

  const isEdit = !!receiptId;
  const [items, setItems] = useState<StockInItem[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  // Removed tab filters; always show all items

  // categories filter (optional like inventory)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectAllCategories, setSelectAllCategories] = useState(false);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [banks, setBanks] = useState<SupplierBank[]>([]);
  const [editingBank, setEditingBank] = useState<SupplierBank | null>(null);
  const [bankForm] = Form.useForm();
  const supplierId = Form.useWatch("supplierId", form);

  // Watch form values for bank info display
  const supplierBankAccountNumber = Form.useWatch("supplierBankAccountNumber", form);
  const supplierBankAccountName = Form.useWatch("supplierBankAccountName", form);
  const supplierBankName = Form.useWatch("supplierBankName", form);

  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      form.resetFields();
      setItems([]);
      form.setFieldsValue({ date: dayjs() });
      return;
    }
    // Edit mode: load detail
    (async () => {
      try {
        if (!receiptId) return;
        const res = await receiptsService.detail(receiptId);
        const d = res.data as any;
        form.setFieldsValue({
          date: d?.receiptTime ? dayjs(d.receiptTime) : dayjs(),
          supplierId: d?.supplierId,
          note: d?.note,
          supplierBankAccountNumber: d?.supplierBankAccountNumber,
          supplierBankAccountName: d?.supplierBankAccountName,
          supplierBankName: d?.supplierBankName,
        });
        setPaymentMethod((d?.paymentMethod || "cash") as any);
        setDiscount(Number(d?.discount || 0));
        setPaymentAmount(Number(d?.paymentAmount || 0));
        const loadedItems: StockInItem[] = (d?.items || []).map((i: any) => ({
          productId: i.productId,
          code: String(i.productId),
          name: "",
          quantity: i.quantity,
          costPrice: i.costPrice,
          lineTotal: Number(i.quantity) * Number(i.costPrice || 0),
        }));
        setItems(loadedItems);
      } catch (e: any) {
        message.error(e?.message || "Tải phiếu thất bại");
      }
    })();
  }, [open, isEdit, form, receiptId]);

  // Load banks when modal opens and supplier selected
  useEffect(() => {
    const fetchBanks = async () => {
      if (!bankModalOpen || !supplierId) return;
      try {
        const res = await supplierBankAccountsService.list({ supplierId: Number(supplierId) });
        const data = res.data;
        setBanks(Array.isArray(data) ? data : []);
      } catch {
        setBanks([]);
      }
    };
    fetchBanks();
  }, [bankModalOpen, supplierId]);

  // Sync modal form with editing state
  useEffect(() => {
    if (!bankModalOpen) return;
    if (editingBank) {
      bankForm.setFieldsValue({
        accountNumber: editingBank.accountNumber,
        accountName: editingBank.accountName,
        bankName: editingBank.bankName,
      });
    } else {
      bankForm.resetFields();
    }
  }, [editingBank, bankModalOpen, bankForm]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 120);
    return () => clearTimeout(t);
  }, [query]);

  // search products (reuse productService like inventory)
  const [productsWithImages, setProductsWithImages] = useState<any[]>([]);
  useEffect(() => {
    const run = async () => {
      if (!debouncedQuery) {
        setProductsWithImages([]);
        return;
      }
      try {
        const svc = await import("@/services/productService");
        // category search optional: query by name only for now
        const res = await svc.productService.list({ name: debouncedQuery } as any);
        const list: any[] = (res as any)?.data || [];
        const detailWithImages = await Promise.all(
          list.slice(0, 6).map(async (p: any) => {
            try {
              const d = await svc.productService.detail({ id: p.id } as any);
              return { ...p, images: (d as any)?.data?.images || [], costPrice: (d as any)?.data?.costPrice ?? 0 };
            } catch {
              return { ...p, images: [], costPrice: 0 };
            }
          }),
        );
        setProductsWithImages(detailWithImages);
      } catch {
        setProductsWithImages([]);
      }
    };
    run();
  }, [debouncedQuery]);

  // Auto add products when selecting categories (like inventory experience)
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
              const newItem: StockInItem = {
                productId: p.id,
                code: p.code || String(p.id),
                name: p.name,
                quantity: 1,
                costPrice: cost,
                lineTotal: cost,
              };
              setItems((prev) => (prev.some((x) => x.productId === p.id) ? prev : [...prev, newItem]));
            } catch {
              const newItem: StockInItem = { productId: p.id, code: p.code || String(p.id), name: p.name, quantity: 1, costPrice: 0, lineTotal: 0 };
              setItems((prev) => (prev.some((x) => x.productId === p.id) ? prev : [...prev, newItem]));
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
    const newItem: StockInItem = {
      productId: id,
      code: p.code || String(id),
      name: p.name,
      quantity: 1,
      costPrice: cost,
      lineTotal: cost,
      images: p.images || [],
    };
    setItems((prev) => (prev.some((x) => x.productId === id) ? prev : [...prev, newItem]));
  };

  const updateQuantity = (productId: number, q: number) => {
    const quantity = Math.max(0, Number(q) || 0);
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity, lineTotal: quantity * (i.costPrice ?? 0) } : i)));
  };

  const updateCost = (productId: number, c: number) => {
    const cost = Math.max(0, Number(c) || 0);
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, costPrice: cost, lineTotal: cost * (i.quantity ?? 0) } : i)));
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const removeAllItems = () => {
    Modal.confirm({
      title: "Xác nhận",
      content: "Xóa tất cả sản phẩm khỏi danh sách nhập?",
      okText: "Xóa tất cả",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: () => setItems([]),
    });
  };

  const columns: TableColumnsType<StockInItem> = [
    { title: "Mã hàng", dataIndex: "code", key: "code", width: 140 },
    { title: "Tên hàng", dataIndex: "name", key: "name", width: 220 },
    {
      title: "SL nhập",
      key: "quantity",
      width: 120,
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.quantity}
          onChange={(val) => updateQuantity(r.productId, Number(val))}
          style={{ width: 100 }}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, "")) || 0}
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
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, "")) || 0}
        />
      ),
    },
    { title: "Thành tiền", dataIndex: "lineTotal", key: "lineTotal", width: 140, render: (v) => (v ?? 0).toLocaleString() },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, r) => (
        <Button
          danger
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            removeItem(r.productId);
          }}
        >
          Xóa
        </Button>
      ),
    },
  ];

  const totals = useMemo(() => {
    const totalQuantity = items.reduce((s, i) => s + (i.quantity ?? 0), 0);
    const totalAmount = items.reduce((s, i) => s + (i.lineTotal ?? 0), 0);
    const needPay = Math.max(0, totalAmount - (discount || 0));
    const debt = Math.max(0, needPay - (paymentAmount || 0));
    return { totalQuantity, totalAmount, needPay, debt };
  }, [items, discount, paymentAmount]);

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

    try {
      const payload: CreateReceiptRequest = {
        supplierId: Number(values.supplierId),
        receiptTime: (values.date ? dayjs(values.date) : dayjs()).toISOString() as any,
        paymentMethod: paymentMethod,
        discount: Number(discount || 0) as any,
        paymentAmount: Number(paymentAmount || 0) as any,
        supplierBankAccountNumber: values.supplierBankAccountNumber || undefined,
        supplierBankAccountName: values.supplierBankAccountName || undefined,
        supplierBankName: values.supplierBankName || undefined,
        complete,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, costPrice: i.costPrice })) as any,
      };

      await receiptsService.create(payload);
      message.success(complete ? "Đã hoàn thành phiếu nhập" : "Đã lưu nháp phiếu nhập");
      try {
        onChanged?.();
      } catch {}
      onClose();
    } catch (e: any) {
      message.error(e?.message || "Lưu phiếu nhập thất bại");
    }
  };

  const onSave = (complete: boolean) => {
    if (complete) {
      Modal.confirm({
        title: "Xác nhận hoàn thành",
        content: "Bạn có chắc chắn muốn hoàn thành phiếu nhập?",
        okText: "Hoàn thành",
        cancelText: "Đóng",
        onOk: () => doSave(true),
      });
    } else {
      Modal.confirm({
        title: "Xác nhận lưu nháp",
        content: "Bạn có chắc chắn muốn lưu nháp phiếu nhập?",
        okText: "Lưu nháp",
        cancelText: "Đóng",
        onOk: () => doSave(false),
      });
    }
  };

  return (
    <Drawer
      title={isEdit ? "Chỉnh sửa phiếu nhập" : "Thêm phiếu nhập"}
      width={1000}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 160 } }}
      footer={
        <div className="text-right">
          <Space>
            <Button onClick={onClose} icon={<CloseOutlined />}>
              Đóng
            </Button>
            {!isEdit ? (
              <>
                <Button type="default" onClick={() => onSave(false)} icon={<SaveOutlined />}>
                  Lưu nháp
                </Button>
                <Button type="primary" onClick={() => onSave(true)} icon={<SaveOutlined />}>
                  Hoàn thành
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="default"
                  onClick={async () => {
                    try {
                      const values = form.getFieldsValue();

                      // Validate supplier selection
                      if (!values.supplierId) {
                        message.warning("Vui lòng chọn nhà cung cấp");
                        return;
                      }

                      const payload: CreateReceiptRequest = {
                        supplierId: Number(values.supplierId),
                        receiptTime: (values.date ? dayjs(values.date) : dayjs()).toISOString() as any,
                        paymentMethod: paymentMethod,
                        discount: Number(discount || 0) as any,
                        paymentAmount: Number(paymentAmount || 0) as any,
                        supplierBankAccountNumber: values.supplierBankAccountNumber || undefined,
                        supplierBankAccountName: values.supplierBankAccountName || undefined,
                        supplierBankName: values.supplierBankName || undefined,
                        complete: false,
                        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, costPrice: i.costPrice })) as any,
                      };
                      Modal.confirm({
                        title: "Xác nhận lưu nháp",
                        content: "Bạn có chắc chắn muốn lưu nháp phiếu nhập?",
                        okText: "Lưu nháp",
                        cancelText: "Đóng",
                        onOk: async () => {
                          await receiptsService.update(Number(receiptId), payload);
                          message.success("Đã lưu phiếu tạm");
                          try {
                            onChanged?.();
                          } catch {}
                          onClose();
                        },
                      });
                    } catch (e: any) {
                      message.error(e?.message || "Lưu thất bại");
                    }
                  }}
                  icon={<SaveOutlined />}
                >
                  Lưu
                </Button>
                <Button
                  type="primary"
                  onClick={async () => {
                    try {
                      const values = form.getFieldsValue();

                      // Validate supplier selection
                      if (!values.supplierId) {
                        message.warning("Vui lòng chọn nhà cung cấp");
                        return;
                      }

                      Modal.confirm({
                        title: "Xác nhận hoàn thành",
                        content: "Bạn có chắc chắn muốn hoàn thành phiếu nhập?",
                        okText: "Hoàn thành",
                        cancelText: "Đóng",
                        onOk: async () => {
                          try {
                            await receiptsService.complete(Number(receiptId));
                            message.success("Đã hoàn thành phiếu");
                            try {
                              onChanged?.();
                            } catch {}
                            onClose();
                          } catch (e: any) {
                            message.error(e?.message || "Hoàn thành thất bại");
                          }
                        },
                      });
                    } catch (e: any) {
                      message.error(e?.message || "Hoàn thành thất bại");
                    }
                  }}
                  icon={<SaveOutlined />}
                >
                  Hoàn thành
                </Button>
              </>
            )}
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ date: dayjs() }}>
        {/* Persist selected bank info in form values */}
        <Form.Item name="supplierBankAccountNumber" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="supplierBankAccountName" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="supplierBankName" hidden>
          <Input />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="date" label="Ngày nhập" rules={[{ required: true, message: "Vui lòng chọn ngày" }]}>
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" allowClear={false} disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true, message: "Chọn nhà cung cấp" }]}>
              <Select
                showSearch
                placeholder="Chọn nhà cung cấp"
                optionFilterProp="label"
                options={(suppliers?.data || []).map((s: any) => ({ label: s.name, value: s.id }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Người tạo">
              <Input value={user?.fullName || user?.userName || "-"} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12} align="middle">
          <Col span={24}>
            <div className="mb-2 font-semibold">Thêm sản phẩm</div>
            <div className="mb-2 flex items-center gap-3">
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                prefix={<SearchOutlined />}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ flex: 1 }}
              />
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
              <Checkbox checked={selectAllCategories} onChange={(e) => setSelectAllCategories(e.target.checked)}>
                Tất cả nhóm
              </Checkbox>
            </div>

            {debouncedQuery && productsWithImages.length > 0 && (
              <Card size="small" className="mb-2">
                <List
                  size="small"
                  dataSource={productsWithImages}
                  renderItem={(product: any) => (
                    <List.Item
                      className="cursor-pointer rounded border-b border-gray-100 p-3 hover:bg-gray-50"
                      onClick={() => onSelectProduct(product)}
                    >
                      <div className="flex w-full items-center">
                        <div className="mr-3">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              width={60}
                              height={60}
                              src={product.images[0]}
                              alt={product.name}
                              style={{ objectFit: "contain", borderRadius: 8 }}
                            />
                          ) : (
                            <div
                              className="flex items-center justify-center bg-gray-100 text-xs text-gray-400"
                              style={{ width: 60, height: 60, borderRadius: 8 }}
                            >
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 text-base font-semibold">{product.name}</div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Mã:</span> {product.code || product.id}
                          </div>
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
              <Button danger onClick={removeAllItems}>
                Xóa tất cả
              </Button>
            </Space>
          </div>
        )}

        <Table<StockInItem> size="small" rowKey={(r) => r.productId} columns={columns} dataSource={items} pagination={false} />

        <Card className="mt-3" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="note" label="Ghi chú">
                <Input.TextArea rows={4} placeholder="Nhập ghi chú" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng số lượng</span>
                  <span className="font-semibold">{totals.totalQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng tiền hàng</span>
                  <span className="font-semibold">{totals.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Giảm giá</span>
                  <InputNumber
                    min={0}
                    value={discount}
                    onChange={(v) => setDiscount(Number(v) || 0)}
                    style={{ width: 160 }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, "")) || 0}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cần trả NCC</span>
                  <span className="font-semibold">{totals.needPay.toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-gray-600">
                      <CreditCardOutlined /> Tiền trả nhà cung cấp
                    </span>
                    <InputNumber
                      min={0}
                      value={paymentAmount}
                      onChange={(v) => setPaymentAmount(Number(v) || 0)}
                      style={{ width: 160 }}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, "")) || 0}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type={paymentMethod === "cash" ? "primary" : "default"} onClick={() => setPaymentMethod("cash")}>
                      Tiền mặt
                    </Button>
                    <Button
                      type={paymentMethod === "transfer" ? "primary" : "default"}
                      onClick={() => {
                        setPaymentMethod("transfer");
                        setBankModalOpen(true);
                      }}
                    >
                      Chuyển khoản
                    </Button>
                  </div>
                  {paymentMethod === "transfer" && supplierBankAccountNumber && (
                    <div className="mt-2 rounded border bg-blue-50 p-2">
                      <div className="text-sm text-gray-600">Thông tin ngân hàng đã chọn:</div>
                      <div className="text-sm font-medium">
                        {supplierBankAccountNumber} - {supplierBankAccountName}
                      </div>
                      <div className="text-sm text-gray-500">{supplierBankName}</div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tính vào công nợ</span>
                  <span className="font-semibold">{totals.debt.toLocaleString()}</span>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Form>

      {/* Modal quản lý ngân hàng nhà cung cấp */}
      <Modal
        title="Ngân hàng nhà cung cấp"
        open={bankModalOpen}
        onCancel={() => {
          setBankModalOpen(false);
          setEditingBank(null);
          bankForm.resetFields();
        }}
        footer={null}
        destroyOnHidden
      >
        <div className="mb-3">
          <Form
            form={bankForm}
            layout="vertical"
            initialValues={editingBank ?? { accountNumber: "", accountName: "", bankName: "" }}
            onFinish={async (vals: any) => {
              try {
                if (!supplierId) {
                  message.warning("Vui lòng chọn nhà cung cấp trước");
                  return;
                }
                const payload = {
                  supplierId: Number(supplierId),
                  accountNumber: String(vals.accountNumber || "").trim(),
                  accountName: String(vals.accountName || "").trim(),
                  bankName: String(vals.bankName || "").trim(),
                  isDefault: false,
                };
                if (editingBank) {
                  await supplierBankAccountsService.update(Number(editingBank.id), payload as any);
                } else {
                  await supplierBankAccountsService.create(payload as any);
                }
                const res = await supplierBankAccountsService.list({ supplierId: Number(supplierId) });
                const data = res.data;
                setBanks(Array.isArray(data) ? data : []);
                setEditingBank(null);
                message.success(editingBank ? "Đã cập nhật ngân hàng" : "Đã thêm ngân hàng");
              } catch (e: any) {
                // Handle backend validation errors
                const errorMessage = e?.response?.data?.message || e?.message || "Lưu ngân hàng thất bại";
                message.error(errorMessage);
              }
            }}
          >
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="accountNumber" label="Số tài khoản" rules={[{ required: true, message: "Nhập số tài khoản" }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="accountName" label="Chủ TK" rules={[{ required: true, message: "Nhập chủ tài khoản" }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="bankName" label="Ngân hàng" rules={[{ required: true, message: "Nhập tên ngân hàng" }]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <div className="text-right">
              <Space>
                {editingBank && <Button onClick={() => setEditingBank(null)}>Hủy sửa</Button>}
                <Button htmlType="submit" type="primary">
                  {editingBank ? "Cập nhật" : "Thêm mới"}
                </Button>
              </Space>
            </div>
          </Form>
        </div>

        <Table<SupplierBank>
          size="small"
          rowKey={(r) => r.id}
          dataSource={banks}
          pagination={false}
          columns={[
            { title: "Số tài khoản", dataIndex: "accountNumber", key: "accountNumber", width: 160 },
            { title: "Chủ TK", dataIndex: "accountName", key: "accountName", width: 160 },
            { title: "Ngân hàng", dataIndex: "bankName", key: "bankName" },
            {
              title: "",
              key: "actions",
              width: 200,
              render: (_, r) => (
                <Space>
                  <Button
                    size="small"
                    onClick={() => {
                      form.setFieldsValue({
                        supplierBankAccountNumber: r.accountNumber,
                        supplierBankAccountName: r.accountName,
                        supplierBankName: r.bankName,
                      });
                      setBankModalOpen(false);
                      message.success("Đã chọn ngân hàng");
                    }}
                  >
                    Chọn
                  </Button>
                  <Button size="small" onClick={() => setEditingBank(r)}>
                    Sửa
                  </Button>
                  <Button
                    danger
                    size="small"
                    onClick={async () => {
                      try {
                        await supplierBankAccountsService.delete(Number(r.id));
                        const res = await supplierBankAccountsService.list({ supplierId: Number(supplierId) });
                        const data = res.data;
                        setBanks(Array.isArray(data) ? data : []);
                      } catch (e: any) {
                        const errorMessage = e?.response?.data?.message || e?.message || "Xóa thất bại";
                        message.error(errorMessage);
                      }
                    }}
                  >
                    Xóa
                  </Button>
                </Space>
              ),
            },
          ]}
          locale={{ emptyText: "Chưa có ngân hàng nào" }}
        />
      </Modal>

      <div className="mt-4 text-sm text-gray-500">
        <p>Lưu ý:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Mã phiếu nhập sẽ được hệ thống sinh tự động.</li>
          <li>Lưu nháp: Phiếu tạm; Hoàn thành: chốt phiếu và cập nhật tồn kho.</li>
        </ul>
      </div>
    </Drawer>
  );
};

export default CreateEditStockInDrawer;
