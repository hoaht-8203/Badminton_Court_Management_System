"use client";

import { useEffect, useMemo, useState } from "react";
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
  Select,
  Space,
  Table,
  message,
  Modal,
  Checkbox,
  List,
  Image,
} from "antd";
import { CreditCardOutlined, SaveOutlined, CloseOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import { useListSuppliers } from "@/hooks/useSuppliers";
import { useListCategories } from "@/hooks/useCategories";
import { returnGoodsService } from "@/services/returnGoodsService";
import { storeBankAccountsService } from "@/services/storeBankAccountsService";
import { useQueryClient } from "@tanstack/react-query";

type ItemRow = {
  productId: number;
  code: string;
  name: string;
  quantity: number;
  importPrice: number;
  returnPrice: number;
  lineTotal: number;
  stock: number; // Thêm thông tin tồn kho
};

type Props = {
  open: boolean;
  onClose: () => void;
  returnGoodsId?: number;
  onChanged?: () => void;
};

const CreateEditReturnGoodsDrawer: React.FC<Props> = ({ open, onClose, returnGoodsId, onChanged }) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = !!returnGoodsId;

  const { data: suppliersRes } = useListSuppliers({});

  const [items, setItems] = useState<ItemRow[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [supplierPaid, setSupplierPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash");

  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [editingBank, setEditingBank] = useState<any | null>(null);
  const [bankForm] = Form.useForm();
  
  // Watch form values for bank info display
  const storeBankAccountNumber = Form.useWatch("storeBankAccountNumber", form);
  const storeBankAccountName = Form.useWatch("storeBankAccountName", form);
  const storeBankName = Form.useWatch("storeBankName", form);

  // Categories filter
  const { data: categoriesData } = useListCategories({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectAllCategories, setSelectAllCategories] = useState(false);

  // Theo dõi trạng thái phiếu hiện tại
  const [currentStatus, setCurrentStatus] = useState<0 | 1 | 2>(0); // 0: draft, 1: completed, 2: cancelled

  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      // Create mode - reset form
      form.resetFields();
      setItems([]);
      setDiscount(0);
      setSupplierPaid(0);
      setPaymentMethod("cash");
      setCurrentStatus(0);
      form.setFieldsValue({
        date: dayjs(),
        returnBy: user?.fullName || user?.userName || "",
      });
      return;
    }
    // Edit mode - load detail
    (async () => {
      try {
        if (!returnGoodsId) return;
        const res = await returnGoodsService.detail(returnGoodsId);
        const d = res.data as any;
        form.setFieldsValue({
          date: d?.returnTime ? dayjs(d.returnTime) : dayjs(),
          supplierId: d?.supplierId,
          note: d?.note,
        });
        setPaymentMethod(d?.paymentMethod === 1 ? "transfer" : "cash");
        setDiscount(Number(d?.discount || 0));
        setSupplierPaid(Number(d?.supplierPaid || 0));
        setCurrentStatus(d?.status || 0);
        const loadedItems: ItemRow[] = await Promise.all((d?.items || []).map(async (i: any) => {
          // Lấy thông tin stock từ productService.detail()
          let stock = 0;
          try {
            const svc = await import("@/services/productService");
            const productDetail = await svc.productService.detail({ id: i.productId } as any);
            stock = (productDetail as any)?.data?.stock ?? 0;
            console.log(`Load return goods item ${i.productName} (${i.productId}) stock:`, stock); // Debug log
          } catch (error) {
            console.log(`Error getting stock for return goods item ${i.productName} (${i.productId}):`, error); // Debug log
          }
          
          return {
            productId: i.productId,
            code: i.productCode || String(i.productId),
            name: i.productName || "",
            quantity: i.quantity,
            importPrice: i.importPrice,
            returnPrice: i.returnPrice,
            lineTotal: Number(i.quantity) * Number(i.returnPrice || 0),
            stock: stock, // Sử dụng stock từ API
          };
        }));
        setItems(loadedItems);
      } catch (e) {
        console.error("Load return goods detail failed:", e);
        message.error("Không thể tải dữ liệu phiếu trả hàng");
      }
    })();
  }, [open, isEdit, returnGoodsId, form, user?.fullName, user?.userName]);

  useEffect(() => {
    if (!bankModalOpen) return;
    (async () => {
      try {
        const res = await storeBankAccountsService.list();
        const data = (res as any)?.data;
        setBanks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading store bank accounts:', error);
        setBanks([]);
      }
    })();
  }, [bankModalOpen]);

  // Debounce search text
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 120);
    return () => clearTimeout(t);
  }, [query]);

  // Search products and show quick list (with images)
  const [productsWithImages, setProductsWithImages] = useState<any[]>([]);
  useEffect(() => {
    const run = async () => {
      if (!debouncedQuery) {
        setProductsWithImages([]);
        return;
      }
      try {
        const svc = await import("@/services/productService");
        const res = await svc.productService.list({ name: debouncedQuery } as any);
        const list: any[] = (res as any)?.data || [];
        const detailWithImages = await Promise.all(
          list.slice(0, 6).map(async (p: any) => {
            try {
              const d = await svc.productService.detail({ id: p.id } as any);
              const stock = (d as any)?.data?.stock ?? 0;
              console.log(`Product ${p.name} (${p.id}) stock:`, stock); // Debug log
              return { ...p, images: (d as any)?.data?.images || [], costPrice: (d as any)?.data?.costPrice ?? 0, stock: stock };
            } catch (error) {
              console.log(`Error getting stock for product ${p.name} (${p.id}):`, error); // Debug log
              return { ...p, images: [], costPrice: 0, stock: 0 };
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

  // Auto add products when selecting categories (like stock-in)
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
              console.log(`Auto-add product ${p.name} (${p.id}) stock:`, stock); // Debug log
              const newItem = {
                productId: p.id,
                code: p.code || String(p.id),
                name: p.name,
                quantity: 1,
                importPrice: cost,
                returnPrice: cost,
                lineTotal: cost,
                stock: stock,
              } as ItemRow;
              setItems((prev) => (prev.some((x) => x.productId === p.id) ? prev : [...prev, newItem]));
            } catch (error) {
              console.log(`Error auto-adding product ${p.name} (${p.id}):`, error); // Debug log
              const newItem = {
                productId: p.id,
                code: p.code || String(p.id),
                name: p.name,
                quantity: 1,
                importPrice: 0,
                returnPrice: 0,
                lineTotal: 0,
                stock: 0,
              } as ItemRow;
              setItems((prev) => (prev.some((x) => x.productId === p.id) ? prev : [...prev, newItem]));
            }
          }
        }
      } catch {}
    };
    if (selectedCategories.length > 0 || selectAllCategories) run();
  }, [selectedCategories, selectAllCategories, categoriesData?.data]);

  const totals = useMemo(() => {
    const itemsTotal = items.reduce((s, i) => s + (i.lineTotal || 0), 0);
    const needPay = Math.max(0, itemsTotal - (discount || 0));
    const debt = Math.max(0, needPay - (supplierPaid || 0));
    const totalQuantity = items.reduce((s, i) => s + (i.quantity || 0), 0);
    return { itemsTotal, needPay, debt, totalQuantity };
  }, [items, discount, supplierPaid]);

  // const addProductByQuery = async () => {
  //   const q = query.trim();
  //   if (!q) return;
  //   try {
  //     const svc = await import("@/services/productService");
  //     const res = await svc.productService.list({ name: q } as any);
  //     const list: any[] = (res as any)?.data || [];
  //     const p = list[0];
  //     if (!p) {
  //       message.info("Không tìm thấy sản phẩm");
  //       return;
  //     }
  //     let cost = 0;
  //     try {
  //       const d = await svc.productService.detail({ id: p.id } as any);
  //       cost = (d as any)?.data?.costPrice ?? 0;
  //     } catch {}
  //     const exist = items.some((x) => x.productId === p.id);
  //     if (exist) return;
  //     setItems((prev) =>
  //       prev.concat([
  //         { productId: p.id, code: p.code || String(p.id), name: p.name, quantity: 1, importPrice: cost, returnPrice: cost, lineTotal: cost },
  //       ]),
  //     );
  //   } catch {}
  // };

  const updateQuantity = (productId: number, q: number) => {
    const quantity = Math.max(0, Number(q) || 0);
    const item = items.find(i => i.productId === productId);
    
    // Validation đơn giản: không cho nhập vượt quá tồn kho
    if (item && quantity > item.stock) {
      return; // Không cập nhật, không hiện message
    }
    
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity, lineTotal: quantity * (i.returnPrice || 0) } : i)));
  };

  const updateReturnPrice = (productId: number, price: number) => {
    const v = Math.max(0, Number(price) || 0);
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, returnPrice: v, lineTotal: v * (i.quantity || 0) } : i)));
  };

  const removeItem = (productId: number) => setItems((prev) => prev.filter((i) => i.productId !== productId));

  const columns = [
    { title: "Mã hàng", dataIndex: "code", key: "code", width: 140 },
    { title: "Tên hàng", dataIndex: "name", key: "name", width: 220 },
    { title: "Tồn kho", dataIndex: "stock", key: "stock", width: 100, render: (v: number) => (v ?? 0).toLocaleString() },
    {
      title: "SL trả",
      key: "quantity",
      width: 120,
      render: (_: any, r: ItemRow) => (
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
      title: "Giá nhập",
      key: "importPrice",
      width: 120,
      render: (_: any, r: ItemRow) => (
        <InputNumber 
          min={0} 
          value={r.importPrice} 
          disabled 
          style={{ width: 120 }} 
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
        />
      ),
    },
    {
      title: "Giá trả",
      key: "returnPrice",
      width: 120,
      render: (_: any, r: ItemRow) => (
        <InputNumber 
          min={0} 
          value={r.returnPrice} 
          onChange={(val) => updateReturnPrice(r.productId, Number(val))} 
          style={{ width: 120 }} 
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
        />
      ),
    },
    { title: "Thành tiền", dataIndex: "lineTotal", key: "lineTotal", width: 140, render: (v: number) => (v ?? 0).toLocaleString() },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_: any, r: ItemRow) => (
        <Button danger size="small" onClick={() => removeItem(r.productId)}>
          Xóa
        </Button>
      ),
    },
  ];

  const doSave = async (complete: boolean) => {
    try {
      const values = form.getFieldsValue();

      // Validate supplier selection
      if (!values.supplierId) {
        message.warning("Vui lòng chọn nhà cung cấp");
        return;
      }

      // Validate stock quantity - đơn giản
      const invalidItems = items.filter(item => item.quantity > item.stock);
      if (invalidItems.length > 0) {
        message.error("Số lượng trả hàng không được vượt quá tồn kho");
        return;
      }

      if (complete && isEdit && returnGoodsId) {
        // Sử dụng API complete riêng biệt cho edit mode
        await returnGoodsService.complete(returnGoodsId);
        message.success("Đã hoàn thành trả hàng");
      } else {
        // Sử dụng update/create với payload
        const payload: any = {
          supplierId: Number(values.supplierId),
          returnTime: (values.date ? dayjs(values.date) : dayjs()).toISOString(),
          paymentMethod: paymentMethod === "cash" ? 0 : 1,
          discount: Number(discount || 0),
          supplierPaid: Number(supplierPaid || 0),
          storeBankAccountId: paymentMethod === "transfer" ? Number(values.storeBankAccountId) : undefined,
          note: values.note || undefined,
          complete,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, importPrice: i.importPrice, returnPrice: i.returnPrice })),
        };

        if (isEdit && returnGoodsId) {
          await returnGoodsService.update(returnGoodsId, payload);
          message.success("Đã lưu thay đổi");
        } else {
          await returnGoodsService.create(payload);
          message.success(complete ? "Đã tạo và hoàn thành trả hàng" : "Đã lưu nháp");
        }
      }

      // Invalidate queries to refresh data
      try {
        await queryClient.invalidateQueries({ queryKey: ["return-goods"] });
        await queryClient.invalidateQueries({ queryKey: ["products"] });
        await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        // Invalidate all queries that might contain return goods data
        await queryClient.invalidateQueries({ queryKey: ["inventory-checks"] });
      } catch {}
      
      // Call onChanged to refresh parent component data
      if (onChanged) {
        // Add longer delay to ensure API changes are committed
        setTimeout(() => {
          onChanged();
        }, 500);
      }

      onClose();
    } catch (e: any) {
      message.error(e?.message || "Lưu phiếu trả hàng thất bại");
    }
  };

  // Hàm hủy phiếu
  const doCancel = async () => {
    try {
      if (!returnGoodsId) return;
      await returnGoodsService.cancel(returnGoodsId);
      message.success("Đã hủy phiếu trả hàng");

      // Invalidate queries to refresh data
      try {
        await queryClient.invalidateQueries({ queryKey: ["return-goods"] });
        await queryClient.invalidateQueries({ queryKey: ["products"] });
        await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        // Invalidate all queries that might contain return goods data
        await queryClient.invalidateQueries({ queryKey: ["inventory-checks"] });
      } catch {}
      
      // Call onChanged to refresh parent component data
      if (onChanged) {
        // Add longer delay to ensure API changes are committed
        setTimeout(() => {
          onChanged();
        }, 500);
      }

      onClose();
    } catch (e: any) {
      message.error(e?.message || "Hủy phiếu thất bại");
    }
  };
  const onSave = async (complete: boolean) => {
    try {
      // Validate form trước khi hiện confirm modal
      await form.validateFields();

      if ((items || []).length === 0) {
        message.warning("Vui lòng thêm sản phẩm");
        return;
      }

      const confirmTitle = complete ? (isEdit ? "Xác nhận hoàn thành trả hàng" : "Xác nhận trả hàng") : "Xác nhận lưu nháp";

      const confirmOkText = complete ? (isEdit ? "Hoàn thành" : "Trả hàng") : "Lưu nháp";

      const confirmContent = complete
        ? "Sau khi hoàn thành, trạng thái phiếu sẽ chuyển thành 'Đã trả hàng' và không thể chỉnh sửa."
        : "Phiếu sẽ được lưu với trạng thái 'Phiếu tạm' và có thể chỉnh sửa sau.";

      Modal.confirm({
        title: confirmTitle,
        content: confirmContent,
        okText: confirmOkText,
        cancelText: "Hủy",
        onOk: () => doSave(complete),
      });
    } catch (e: any) {
      if (e?.errorFields) {
        // Form validation error - focus vào field đầu tiên có lỗi
        const firstErrorField = e.errorFields[0];
        if (firstErrorField?.name) {
          form.scrollToField(firstErrorField.name);
        }
        message.warning("Vui lòng điền đầy đủ thông tin bắt buộc");
      }
    }
  };

  return (
    <Drawer
      title={isEdit ? "Chỉnh sửa phiếu trả hàng" : "Thêm phiếu trả hàng"}
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
                <Button onClick={() => onSave(false)} icon={<SaveOutlined />}>
                  Lưu nháp
                </Button>
                <Button type="primary" onClick={() => onSave(true)} icon={<SaveOutlined />}>
                  Trả hàng
                </Button>
              </>
            ) : (
              <>
                {currentStatus === 0 && (
                  <Button
                    danger
                    onClick={() => {
                      Modal.confirm({
                        title: "Xác nhận hủy phiếu",
                        content: "Bạn có chắc chắn muốn hủy phiếu trả hàng này? Hành động này không thể hoàn tác.",
                        okText: "Hủy phiếu",
                        okButtonProps: { danger: true },
                        cancelText: "Đóng",
                        onOk: doCancel,
                      });
                    }}
                  >
                    Hủy phiếu
                  </Button>
                )}
                {currentStatus === 0 && (
                  <>
                    <Button onClick={() => onSave(false)} icon={<SaveOutlined />}>
                      Lưu thay đổi
                    </Button>
                    <Button type="primary" onClick={() => onSave(true)} icon={<SaveOutlined />}>
                      Hoàn thành trả hàng
                    </Button>
                  </>
                )}
                {currentStatus === 1 && <span className="font-semibold text-green-600">✓ Phiếu đã hoàn thành</span>}
                {currentStatus === 2 && <span className="font-semibold text-red-600">✗ Phiếu đã hủy</span>}
              </>
            )}
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ date: dayjs() }}>
        <Form.Item name="storeBankAccountId" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="storeBankAccountNumber" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="storeBankAccountName" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="storeBankName" hidden>
          <Input />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="date" label="Ngày trả" rules={[{ required: true, message: "Vui lòng chọn ngày" }]}>
              <DatePicker disabled style={{ width: "100%" }} format="DD/MM/YYYY" allowClear={false} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true, message: "Vui lòng chọn nhà cung cấp" }]}>
              <Select
                showSearch
                placeholder="Chọn nhà cung cấp"
                optionFilterProp="label"
                allowClear
                options={(suppliersRes?.data || []).map((s: any) => ({ label: s.name, value: s.id }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Người trả">
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
                      onClick={() => {
                        const p = product;
                        if (items.some((x) => x.productId === p.id)) return;
                        const cost = p.costPrice ?? 0;
                        const stock = p.stock ?? 0;
                        console.log(`Click product ${p.name} (${p.id}) stock:`, stock); // Debug log
                        setItems((prev) =>
                          prev.concat([
                            {
                              productId: p.id,
                              code: p.code || String(p.id),
                              name: p.name,
                              quantity: 1,
                              importPrice: cost,
                              returnPrice: cost,
                              lineTotal: cost,
                              stock: stock,
                            },
                          ]),
                        );
                      }}
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
              <Button
                danger
                onClick={() => {
                  Modal.confirm({
                    title: "Xác nhận xóa",
                    content: "Xóa tất cả sản phẩm khỏi danh sách nhập?",
                    okText: "Xóa tất cả",
                    okButtonProps: { danger: true },
                    cancelText: "Hủy",
                    onOk: () => {
                      setItems([]);
                    },
                  });
                }}
              >
                Xóa tất cả
              </Button>
            </Space>
          </div>
        )}

        <Table<ItemRow> size="small" rowKey={(r) => r.productId} columns={columns as any} dataSource={items} pagination={false} />

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
                  <span className="font-semibold">{totals.itemsTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Giảm giá</span>
                  <InputNumber 
                    min={0} 
                    value={discount} 
                    onChange={(v) => setDiscount(Number(v) || 0)} 
                    style={{ width: 160 }} 
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Nhà cung cấp cần trả</span>
                  <span className="font-semibold">{totals.needPay.toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-gray-600">
                      <CreditCardOutlined /> Tiền nhà cung cấp trả
                    </span>
                    <InputNumber 
                      min={0} 
                      value={supplierPaid} 
                      onChange={(v) => setSupplierPaid(Number(v) || 0)} 
                      style={{ width: 160 }} 
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
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
                  {paymentMethod === "transfer" && storeBankAccountNumber && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border">
                      <div className="text-sm text-gray-600">Thông tin ngân hàng đã chọn:</div>
                      <div className="text-sm font-medium">
                        {storeBankAccountNumber} - {storeBankAccountName}
                      </div>
                      <div className="text-sm text-gray-500">{storeBankName}</div>
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

      {/* Modal quản lý tài khoản ngân hàng của cửa hàng */}
      <Modal
        title="Ngân hàng cửa hàng"
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
                if (editingBank) {
                  await storeBankAccountsService.update(Number(editingBank.id), vals);
                } else {
                  await storeBankAccountsService.create(vals);
                }
                const res = await storeBankAccountsService.list();
                const data = (res as any)?.data;
                setBanks(Array.isArray(data) ? data : []);
                setEditingBank(null);
                message.success(editingBank ? "Đã cập nhật tài khoản" : "Đã thêm tài khoản");
              } catch (e: any) {
                // Handle backend validation errors
                const errorMessage = e?.response?.data?.message || e?.message || "Lưu tài khoản thất bại";
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
                <Button type="primary" htmlType="submit">
                  {editingBank ? "Cập nhật" : "Thêm mới"}
                </Button>
              </Space>
            </div>
          </Form>
        </div>

        <Table
          size="small"
          rowKey={(r: any) => r.id}
          dataSource={banks}
          pagination={false}
          columns={[
            { title: "Số tài khoản", dataIndex: "accountNumber", key: "accountNumber", width: 160 },
            { title: "Chủ TK", dataIndex: "accountName", key: "accountName", width: 160 },
            { title: "Ngân hàng", dataIndex: "bankName", key: "bankName" },
            {
              title: "",
              key: "actions",
              width: 220,
              render: (_: any, r: any) => (
                <Space>
                  <Button
                    size="small"
                    onClick={() => {
                      form.setFieldsValue({ 
                        storeBankAccountId: r.id,
                        storeBankAccountNumber: r.accountNumber,
                        storeBankAccountName: r.accountName,
                        storeBankName: r.bankName
                      });
                      setBankModalOpen(false);
                      message.success("Đã chọn tài khoản");
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
                        await storeBankAccountsService.delete(Number(r.id));
                        const res = await storeBankAccountsService.list();
                        const data = (res as any)?.data;
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
          locale={{ emptyText: "Chưa có tài khoản" }}
        />
      </Modal>
    </Drawer>
  );
};

export default CreateEditReturnGoodsDrawer;
