"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Drawer, Form, Input, Row, Divider, message, Space, DatePicker, Table, AutoComplete, InputNumber, Modal } from "antd";
import { SaveOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { useCreateInventoryCheck, useUpdateInventoryCheck, useDetailInventoryCheck, useDeleteInventoryCheck, useCompleteInventoryCheck } from "@/hooks/useInventory";
import { InventoryCheckStatus, CreateInventoryCheckRequest } from "@/types-openapi/api";
import { useListProducts } from "@/hooks/useProducts";
import type { TableColumnsType } from "antd";
import dayjs from "dayjs";

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
  const [items, setItems] = useState<ManualItem[]>([]);
  const [query, setQuery] = useState<string>("");
  const [searchTimer, setSearchTimer] = useState<any>(null);
  const { data: productList } = useListProducts({ name: query } as any);
  const options = useMemo(
    () =>
      (productList?.data ?? []).map((p: any) => ({
        value: `${p.code ?? ""} - ${p.name}`,
        label: `${p.code ?? ""} - ${p.name}`,
        data: { id: p.id, code: p.code ?? "", name: p.name },
      })),
    [productList?.data]
  );

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
      setItems((prev) => {
        if (prev.some((x) => x.productId === id)) return prev;
        return [...prev, { productId: id, code, name, systemQuantity: systemQty, actualQuantity: systemQty, costPrice: cp }];
      });
      return;
    } catch {}
    setItems((prev) => {
      if (prev.some((x) => x.productId === id)) return prev;
      return [...prev, { productId: id, code, name, systemQuantity: systemQty, actualQuantity: systemQty, costPrice: 0 }];
    });
  };

  const onChangeActual = (productId: number, val: number) => {
    setItems((prev) => prev.map((x) => (x.productId === productId ? { ...x, actualQuantity: Number(val) || 0 } : x)));
  };

  const removeItem = (productId: number) => setItems((prev) => prev.filter((x) => x.productId !== productId));

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

  const handleSearch = (val: string) => {
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => setQuery(val), 300);
    setSearchTimer(t);
  };

  return (
    <>
      {contextHolder}
      <Drawer
        title={title}
        width={720}
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
            <Col span={12}>
              <Form.Item name="checkTime" label="Ngày kiểm kê" rules={[{ required: true, message: "Vui lòng chọn ngày kiểm kê!" }]}>
                <DatePicker style={{ width: "100%" }} placeholder="Chọn ngày kiểm kê" format="DD/MM/YYYY" allowClear={false} disabled={!isEdit} />
              </Form.Item>
            </Col>
          </Row>

          {/* Manual product add/search */}
          <Row gutter={12} align="middle">
            <Col span={24}>
              <div className="mb-2 font-semibold">Thêm sản phẩm</div>
              <AutoComplete
                style={{ width: "100%" }}
                options={options}
                placeholder="Tìm mã hàng / tên hàng để thêm"
                value={query}
                onSearch={handleSearch}
                onSelect={onSelectProduct}
              />
            </Col>
          </Row>

          <Divider />

          <Table<ManualItem>
            size="small"
            rowKey={(r) => r.productId}
            columns={columns}
            dataSource={items}
            pagination={false}
          />

          <Divider />

          {/* Status is handled by backend: Draft on create, Cancelled on cancel */}

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={4} placeholder="Nhập ghi chú cho phiếu kiểm kê" />
          </Form.Item>
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
