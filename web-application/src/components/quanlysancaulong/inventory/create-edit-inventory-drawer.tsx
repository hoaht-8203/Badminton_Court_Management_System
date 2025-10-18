"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Drawer, Form, Input, Row, Divider, message, Space, DatePicker, Table, InputNumber, Modal, Card, List, Checkbox, Image, Tabs, Select } from "antd";
import { SaveOutlined, CloseOutlined, DeleteOutlined, SearchOutlined, EditOutlined, DeleteFilled } from "@ant-design/icons";
import { useCreateInventoryCheck, useUpdateInventoryCheck, useDetailInventoryCheck, useDeleteInventoryCheck, useCompleteInventoryCheck } from "@/hooks/useInventory";
import { CreateInventoryCheckRequest } from "@/types-openapi/api";
import { useListProducts } from "@/hooks/useProducts";
import type { TableColumnsType } from "antd";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import { useListCategories } from "@/hooks/useCategories";

interface CreateEditInventoryDrawerProps {
  open: boolean;
  onClose: () => void;
  inventoryId?: number;
}

// status labels no longer used inside this drawer

const CreateEditInventoryDrawer: React.FC<CreateEditInventoryDrawerProps> = ({ open, onClose, inventoryId }) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const isEdit = !!inventoryId;
  const { data: inventoryData } = useDetailInventoryCheck(inventoryId!, isEdit && !!inventoryId);
  const createMutation = useCreateInventoryCheck();
  const updateMutation = useUpdateInventoryCheck();
  const deleteMutation = useDeleteInventoryCheck();
  const completeMutation = useCompleteInventoryCheck();

  const currentStatus = inventoryData?.data?.status as number | undefined;
  const isDraft = currentStatus === 0; // Phiếu tạm
  const isCancelled = currentStatus === 2; // Đã hủy

  useEffect(() => {
    if (open) {
      if (isEdit && inventoryData?.data) {
        const data = inventoryData.data;
        form.setFieldsValue({
          note: data.note,
          checkTime: data.checkTime ? dayjs(data.checkTime) : null,
        });
        // Set items from inventory data
        setItems(
          (data.items ?? []).map((item: any) => ({
            productId: item.productId!,
            code: item.productCode ?? "",
            name: item.productName ?? "",
            systemQuantity: item.systemQuantity ?? 0,
            actualQuantity: item.actualQuantity ?? 0,
            costPrice: item.costPrice ?? 0,
          }))
        );
      } else {
        form.resetFields();
        setItems([]);
        setRecentItems([]); // Clear history when creating new
        // For create mode, fix checkTime to current date
        form.setFieldsValue({ checkTime: dayjs() });
      }
    }
  }, [open, isEdit, inventoryData, form]);

  const onFinish = async (values: any, isComplete = false) => {
    try {
      if (isEdit && !isDraft) {
        messageApi.error("Chỉ phiếu tạm mới được phép cập nhật");
        return;
      }
      const resolvedCheckTime = isEdit
        ? (values.checkTime && values.checkTime.toDate ? values.checkTime.toDate() : values.checkTime)
        : new Date();
      const inventoryCheckData: CreateInventoryCheckRequest = {
        // Enforce current date when creating; convert dayjs -> Date
        checkTime: resolvedCheckTime,
        note: values.note,
        items: items.map((it) => ({
          productId: it.productId,
          systemQuantity: it.systemQuantity ?? 0,
          actualQuantity: it.actualQuantity ?? 0,
        })) as any,
      } as any;

      if (isEdit && inventoryId) {
        if (isCancelled) {
          messageApi.error("Phiếu đã hủy, không thể cập nhật");
          return;
        }
        // Cập nhật phiếu tạm → trạng thái "Đã cân bằng" + cập nhật tồn kho
        await updateMutation.mutateAsync({ id: inventoryId, data: inventoryCheckData });
        messageApi.success("Cập nhật phiếu kiểm kê thành công! Trạng thái: Đã cân bằng");
      } else {
        const result = await createMutation.mutateAsync(inventoryCheckData);
        if (isComplete && result?.data) {
          // Call complete API after creating
          await completeMutation.mutateAsync(result.data);
          messageApi.success("Hoàn thành phiếu kiểm kê thành công! Trạng thái: Đã cân bằng");
        } else {
          messageApi.success("Lưu nháp phiếu kiểm kê thành công! Trạng thái: Phiếu tạm");
        }
      }

      form.resetFields();
      setItems([]);
      setRecentItems([]); // Clear history when closing
      onClose();
    } catch {
      messageApi.error(isEdit ? "Cập nhật phiếu kiểm kê thất bại!" : "Tạo phiếu kiểm kê thất bại!");
    }
  };

  const handleDelete = () => {
    if (!inventoryId) return;

    Modal.confirm({
      title: "Xác nhận hủy phiếu",
      content: "Bạn có chắc chắn muốn hủy phiếu kiểm kê này?",
      okText: "Hủy phiếu",
      cancelText: "Đóng",
      onOk: () => {
        deleteMutation.mutate(inventoryId, {
          onSuccess: () => {
            onClose();
          },
          onError: () => {
            messageApi.error("Xóa phiếu kiểm kê thất bại!");
          },
        });
      },
    });
  };

  const handleSaveDraft = () => {
    Modal.confirm({
      title: "Xác nhận lưu nháp",
      content: "Bạn có chắc chắn muốn lưu nháp phiếu kiểm kê? Trạng thái sẽ là: Phiếu tạm",
      okText: "Lưu nháp",
      cancelText: "Đóng",
      onOk: () => {
        onFinish(form.getFieldsValue(), false);
      },
    });
  };

  const handleComplete = () => {
    Modal.confirm({
      title: "Xác nhận hoàn thành",
      content: "Bạn có chắc chắn muốn hoàn thành phiếu kiểm kê? Trạng thái sẽ là: Đã cân bằng",
      okText: "Hoàn thành",
      cancelText: "Đóng",
      onOk: () => {
        onFinish(form.getFieldsValue(), !isEdit);
      },
    });
  };

  const title = isEdit ? "Chỉnh sửa phiếu kiểm kê" : "Thêm phiếu kiểm kê mới";

  // Manual items state
  type ManualItem = { productId: number; code: string; name: string; systemQuantity: number; actualQuantity: number; costPrice?: number };
  type RecentItem = ManualItem & { action?: 'search' | 'edit' | 'delete' };
  const [items, setItems] = useState<ManualItem[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]); // Separate state for history
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyActive, setOnlyActive] = useState(false);
  const [selectAllCategories, setSelectAllCategories] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const { user } = useAuth();
  const { data: categoriesData } = useListCategories({});
  
  const { data: productList } = useListProducts({ name: debouncedQuery } as any);
  const [productsWithImages, setProductsWithImages] = useState<any[]>([]);

  // Fetch product details with images when search results change
  useEffect(() => {
    if (productList?.data && productList.data.length > 0) {
      const fetchProductDetails = async () => {
        const productDetails = await Promise.all(
          (productList.data || []).slice(0, 5).map(async (product: any) => {
            try {
              const detail = await (await import("@/services/productService")).productService.detail({ id: product.id } as any);
              return {
                ...product,
                images: (detail as any)?.data?.images || []
              };
            } catch {
              return {
                ...product,
                images: []
              };
            }
          })
        );
        setProductsWithImages(productDetails);
      };
      fetchProductDetails();
    } else {
      setProductsWithImages([]);
    }
  }, [productList]);

  const onSelectProduct = async (val: string, option?: any) => {
    const id = Number(option?.data?.id);
    const code = option?.data?.code ?? "";
    const name = option?.data?.name ?? "";
    // try get stock via product detail
    let systemQty = 0;
    try {
      const detail = await (await import("@/services/productService")).productService.detail({ id } as any);
      const anyData: any = (detail as any)?.data;
      systemQty = anyData?.stock ?? 0;
      const cp = anyData?.costPrice ?? 0;
      const newItem = { productId: id, code, name, systemQuantity: systemQty, actualQuantity: systemQty, costPrice: cp };
      setItems((prev) => {
        if (prev.some((x) => x.productId === id)) return prev;
        return [...prev, newItem];
      });
      // Add to recent history
      setRecentItems((prev) => {
        if (prev.some((x) => x.productId === id)) return prev;
        return [...prev, newItem];
      });
      return;
    } catch {}
    const newItem = { productId: id, code, name, systemQuantity: systemQty, actualQuantity: systemQty, costPrice: 0 };
    setItems((prev) => {
      if (prev.some((x) => x.productId === id)) return prev;
      return [...prev, newItem];
    });
    // Add to recent history
    setRecentItems((prev) => {
      if (prev.some((x) => x.productId === id)) return prev;
      return [...prev, newItem];
    });
  };

  const onChangeActual = (productId: number, val: number) => {
    const newQuantity = Number(val) || 0;
    setItems((prev) => prev.map((x) => (x.productId === productId ? { ...x, actualQuantity: newQuantity } : x)));
  };

  // Save to history when user finishes editing (onBlur)
  const onBlurActual = (productId: number) => {
    const item = items.find(x => x.productId === productId);
    if (item) {
      const updatedItem = { ...item, action: 'edit' as const };
      setRecentItems(prev => [...prev, updatedItem]);
    }
  };

  const removeItem = (productId: number) => {
    // Find the item before removing to save to history
    const item = items.find(x => x.productId === productId);
    if (item) {
      const deletedItem = { ...item, action: 'delete' as const };
      setRecentItems(prev => [...prev, deletedItem]);
    }
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  };
  const removeAllItems = () => {
    Modal.confirm({
      title: "Xác nhận",
      content: "Xóa tất cả sản phẩm khỏi danh sách kiểm?",
      okText: "Xóa tất cả",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: () => setItems([]),
    });
  };


  const columns: TableColumnsType<ManualItem> = [
    { title: "Mã hàng", dataIndex: "code", key: "code", width: 140 },
    { title: "Tên hàng", dataIndex: "name", key: "name", width: 220 },
    { title: "Tồn kho", dataIndex: "systemQuantity", key: "systemQuantity", width: 100 },
    { title: "Giá vốn", dataIndex: "costPrice", key: "costPrice", width: 100, render: (v) => (v ?? 0).toLocaleString() },
    {
      title: "Thực tế",
      key: "actualQuantity",
      width: 160,
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.actualQuantity}
          onChange={(val) => onChangeActual(r.productId, Number(val))}
          onBlur={() => onBlurActual(r.productId)}
          style={{ width: 140 }}
        />
      ),
    },
    {
      title: "SL lệch",
      key: "delta",
      width: 100,
      render: (_, r) => (r.actualQuantity ?? 0) - (r.systemQuantity ?? 0),
    },
    {
      title: "Giá trị lệch",
      key: "deltaValue",
      width: 130,
      render: (_, r) => (((r.actualQuantity ?? 0) - (r.systemQuantity ?? 0)) * (r.costPrice ?? 0)).toLocaleString(),
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, r) => (
        <Button danger size="small" onClick={() => removeItem(r.productId)}>
          Xóa
        </Button>
      ),
    },
  ];

  // Derived tabbed datasets
  const tableData = useMemo(() => {
    if (activeTab === "matched") return items.filter((i) => (i.actualQuantity ?? 0) === (i.systemQuantity ?? 0));
    if (activeTab === "delta") return items.filter((i) => (i.actualQuantity ?? 0) !== (i.systemQuantity ?? 0));
    return items;
  }, [items, activeTab]);

  // Fast input feel: update query immediately, debounce API param separately
  const handleSearch = (val: string) => {
    setQuery(val);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 120);
    return () => clearTimeout(t);
  }, [query]);

  // Auto add by filters: when toggles change, fetch list based on current query
  useEffect(() => {
    const run = async () => {
      try {
        const svc = await import("@/services/productService");
        let categoryNames: string[] = selectedCategories;
        if (selectAllCategories && (categoriesData?.data?.length || 0) > 0) {
          categoryNames = (categoriesData?.data || []).map((c: any) => c.name as string);
        }
        const queries = categoryNames.length > 0 ? categoryNames : [undefined];
        for (const catName of queries) {
          const res = await svc.productService.list({ name: query, category: catName } as any);
          const list: any[] = res.data || [];
          const filtered = list.filter((p) => {
            if (onlyActive && !p.isActive) return false;
            return true;
          });
          for (const p of filtered) {
            if (items.some((x) => x.productId === p.id)) continue;
            try {
              const d = await svc.productService.detail({ id: p.id } as any);
              const stock = (d as any)?.data?.stock ?? 0;
              const cp = (d as any)?.data?.costPrice ?? 0;
              if (onlyInStock && stock <= 0) continue;
              const newItem = { productId: p.id, code: p.code || String(p.id), name: p.name, systemQuantity: stock, actualQuantity: stock, costPrice: cp };
              setItems((prev) => {
                if (prev.some((x) => x.productId === p.id)) return prev;
                return [...prev, newItem];
              });
              // Add to recent history
              setRecentItems((prev) => {
                if (prev.some((x) => x.productId === p.id)) return prev;
                return [...prev, newItem];
              });
            } catch {
              if (onlyInStock) continue;
              const newItem = { productId: p.id, code: p.code || String(p.id), name: p.name, systemQuantity: 0, actualQuantity: 0, costPrice: 0 };
              setItems((prev) => {
                if (prev.some((x) => x.productId === p.id)) return prev;
                return [...prev, newItem];
              });
              // Add to recent history
              setRecentItems((prev) => {
                if (prev.some((x) => x.productId === p.id)) return prev;
                return [...prev, newItem];
              });
            }
          }
        }
      } catch {}
    };
    // Trigger only when toggles are on
    if (onlyActive || onlyInStock || selectAllCategories || selectedCategories.length > 0) run();
  }, [onlyActive, onlyInStock, selectAllCategories, selectedCategories, query, categoriesData?.data]);

  return (
    <>
      {contextHolder}
      <Drawer
        title={title}
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
              {isEdit && isDraft && !isCancelled && (
                <Button danger onClick={handleDelete} loading={deleteMutation.isPending} icon={<DeleteOutlined />}>
                  Hủy phiếu
                </Button>
              )}
              {!isEdit && (
                <Button type="default" onClick={handleSaveDraft} icon={<SaveOutlined />}>
                  Lưu nháp
                </Button>
              )}
              {!isEdit && (
                <Button
                  type="primary"
                  onClick={handleComplete}
                  loading={createMutation.isPending || completeMutation.isPending}
                  icon={<SaveOutlined />}
                >
                  Hoàn Thành
                </Button>
              )}
              {isEdit && isDraft && !isCancelled && (
                <Button
                  type="primary"
                  onClick={() => onFinish(form.getFieldsValue(), false)}
                  loading={updateMutation.isPending}
                  icon={<SaveOutlined />}
                >
                  Cập nhật
                </Button>
              )}
            </Space>
          </div>
        }
      >
        {isEdit && isCancelled && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-600 font-medium">Phiếu kiểm kê đã bị hủy</div>
            <div className="text-red-500 text-sm">Phiếu này không thể chỉnh sửa hoặc thực hiện thao tác nào khác.</div>
          </div>
        )}
        
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off" disabled={isEdit && (!isDraft || isCancelled)}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="checkTime" label="Ngày kiểm kê" rules={[{ required: true, message: "Vui lòng chọn ngày kiểm kê!" }]}>
                <DatePicker style={{ width: "100%" }} placeholder="Chọn ngày kiểm kê" format="DD/MM/YYYY" allowClear={false} disabled={!isEdit} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Người kiểm phiếu">
                <Input value={user?.fullName || user?.userName || "-"} disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Card size="small" title="Kiểm gần đây">
                {recentItems.length === 0 ? (
                  <div className="text-gray-400 text-sm">Chưa có</div>
                ) : (
                  (recentItems || []).slice(-6).reverse().map((i, index) => (
                    <div key={`${i.productId}-${index}`} className="flex items-center py-1 text-sm hover:bg-gray-50 rounded px-1">
                      <div className="flex items-center gap-2">
                        {i.action === 'search' && <SearchOutlined className="text-gray-500" />}
                        {i.action === 'edit' && <EditOutlined className="text-gray-500" />}
                        {i.action === 'delete' && <DeleteFilled className="text-gray-500" />}
                        {!i.action && <SearchOutlined className="text-gray-500" />}
                        <span className="truncate" style={{ maxWidth: 180 }}>{i.name}</span>
                        <span className="text-gray-400">({i.actualQuantity})</span>
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </Col>
          </Row>

          {/* Search + Filters in same row */}
          <Row gutter={12} align="middle">
            <Col span={24}>
              <div className="mb-2 font-semibold">Tìm kiếm sản phẩm</div>
              <div className="flex gap-3 items-center mb-2">
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  prefix={<SearchOutlined />}
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ flex: 1 }}
                />
                <div style={{ minWidth: 260 }}>
                  <Select
                    mode="multiple"
                    allowClear
                    style={{ width: "100%" }}
                    placeholder="Chọn nhóm hàng"
                    value={selectedCategories}
                    onChange={(vals) => setSelectedCategories(vals as string[])}
                    options={(categoriesData?.data || []).map((c: any) => ({ label: c.name, value: c.name }))}
                  />
                </div>
                <Checkbox
                  checked={selectAllCategories}
                  onChange={(e) => setSelectAllCategories(e.target.checked)}
                >
                  Tất cả nhóm
                </Checkbox>
                <Checkbox
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                >
                  Còn tồn
                </Checkbox>
                <Checkbox
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                >
                  Đang KD
                </Checkbox>
              </div>
              
              {/* Search Results */}
              {debouncedQuery && productsWithImages.length > 0 && (
                <Card size="small" className="mb-2">
                  <List
                    size="small"
                    dataSource={productsWithImages}
                    renderItem={(product: any) => {
                      return (
                      <List.Item
                        className="cursor-pointer hover:bg-gray-50 p-3 rounded border-b border-gray-100"
                        onClick={() => onSelectProduct(`${product.code} - ${product.name}`, { data: { id: product.id, code: product.code, name: product.name } })}
                      >
                        <div className="flex items-center w-full">
                          {/* Product Image */}
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
                                className="flex items-center justify-center bg-gray-100 text-gray-400 text-xs"
                                style={{ width: 60, height: 60, borderRadius: 8 }}
                              >
                                No Image
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1">
                            <div className="font-semibold text-base mb-1">{product.name}</div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Mã:</span> {product.code || product.id}
                            </div>
                          </div>
                        </div>
                      </List.Item>
                      );
                    }}
                  />
                </Card>
              )}
            </Col>
          </Row>

          <Divider />

          {items.length > 0 && (
            <div className="mb-2 text-right">
              <Space>
                <Button danger onClick={removeAllItems}>Xóa tất cả</Button>
              </Space>
            </div>
          )}

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: "all", label: `Tất cả (${items.length})` },
              { key: "matched", label: `Khớp (${items.filter((i)=> (i.actualQuantity??0)===(i.systemQuantity??0)).length})` },
              { key: "delta", label: `Lệch (${items.filter((i)=> (i.actualQuantity??0)!==(i.systemQuantity??0)).length})` },
            ]}
          />

          <Table<ManualItem>
            size="small"
            rowKey={(r) => r.productId}
            columns={columns}
            dataSource={tableData}
            pagination={false}
          />

          <Divider />

          {/* Status is handled by backend: Draft on create, Cancelled on cancel */}

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={4} placeholder="Nhập ghi chú cho phiếu kiểm kê" />
          </Form.Item>

          {/* Removed bottom recent items panel per request */}
        </Form>

        <Divider />

        <div className="text-sm text-gray-500">
          <p>Lưu ý:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Mã kiểm kê sẽ được hệ thống sinh tự động</li>
            <li>Lưu Nháp: trạng thái là Phiếu tạm; Hoàn thành: trạng thái là Đã cân bằng</li>
          </ul>
        </div>
      </Drawer>

    </>
  );
};

export default CreateEditInventoryDrawer;
