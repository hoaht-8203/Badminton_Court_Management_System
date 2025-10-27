"use client";

import { useCashflowTypes, useRelatedPersons } from "@/hooks/useCashflow";
import type { CashflowResponse, CreateCashflowRequest, UpdateCashflowRequest } from "@/types-openapi/api";
import { Button, DatePicker, Drawer, Form, Input, InputNumber, message, Radio, Select } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo } from "react";

export default function CashflowDrawer({
  open,
  onClose,
  mode = "create",
  initialValues,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "update";
  initialValues?: CashflowResponse | null;
  onSubmit: (payload: CreateCashflowRequest | UpdateCashflowRequest) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [form] = Form.useForm();

  // watch isPayment at top-level to avoid invalid hook call
  const isPayment = Form.useWatch("isPayment", form) ?? false;
  // fetch types when isPayment changes
  const { data: typesData, isLoading: typesLoading } = useCashflowTypes(isPayment);
  const cashflowTypeOptions = useMemo(() => {
    if (!typesData?.data) return [];
    return typesData.data.map((t: any) => ({ value: t.id, label: t.name }));
  }, [typesData]);

  // watch personType, default to 'other' if not selected
  const personType = Form.useWatch("personType", form) ?? "other";
  const { data: relatedPersonsData, isLoading: relatedPersonsLoading } = useRelatedPersons(personType);
  const relatedPersonOptions = useMemo(() => {
    if (!relatedPersonsData?.data) return [];
    return relatedPersonsData.data.map((name: string) => ({ value: name, label: name }));
  }, [relatedPersonsData]);

  // reset dependent fields when toggles change
  // when isPayment changes, clear selected cashflowTypeId so user picks appropriate type
  useEffect(() => {
    if (open) {
      // only reset cashflowTypeId when isPayment is explicitly toggled (not on initial open-set)
      form.setFieldsValue({ cashflowTypeId: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPayment]);

  // when personType changes, clear relatedPerson so stale names don't remain
  useEffect(() => {
    if (open) {
      form.setFieldsValue({ relatedPerson: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personType]);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          cashflowTypeId: initialValues.cashflowTypeId,
          value: initialValues.value,
          isPayment: initialValues.isPayment ?? false,
          personType: initialValues.personType ?? "other",
          relatedPerson: initialValues.relatedPerson,
          note: initialValues.note,
          time: initialValues.time ? dayjs(initialValues.time) : undefined,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ isPayment: false, personType: "other" });
      }
    }
  }, [open, initialValues, form]);

  const handleFinish = async (values: any) => {
    const payload: any = {
      cashflowTypeId: values.cashflowTypeId,
      value: values.value,
      isPayment: !!values.isPayment,
      personType: values.personType ?? undefined,
      relatedPerson: values.relatedPerson ?? undefined,
      note: values.note ?? undefined,
      time: values.time ? values.time.toDate() : undefined,
    };

    try {
      await onSubmit(payload);
    } catch (e: any) {
      message.error(e?.message ?? "Lưu phiếu thất bại");
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ fontWeight: 700 }}>{mode === "create" ? "Lập phiếu thu/chi" : "Cập nhật phiếu"}</div>
          <div>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              Huỷ
            </Button>
            <Button type="primary" loading={submitting} onClick={() => form.submit()}>
              Lưu
            </Button>
          </div>
        </div>
      }
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {/* Thu / Chi high-contrast toggle */}
        <Form.Item name="isPayment" valuePropName="checked" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
            <Radio.Group
              value={isPayment}
              onChange={(e) => form.setFieldsValue({ isPayment: e.target.value })}
              buttonStyle="solid"
              size="large"
              style={{ display: "inline-flex", flexDirection: "row", gap: 6, whiteSpace: "nowrap" }}
            >
              <Radio.Button
                value={false}
                style={{
                  padding: "8px 18px",
                  minWidth: 110,
                  fontWeight: 800,
                  fontSize: 15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 40,
                  lineHeight: "normal",
                }}
              >
                THU
              </Radio.Button>
              <Radio.Button
                value={true}
                style={{
                  padding: "8px 18px",
                  minWidth: 110,
                  fontWeight: 800,
                  fontSize: 15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 40,
                  lineHeight: "normal",
                }}
              >
                CHI
              </Radio.Button>
            </Radio.Group>
          </div>
        </Form.Item>

        <Form.Item name="cashflowTypeId" label="Loại thu chi" rules={[{ required: true, message: "Chọn loại thu/chi" }]}>
          <Select options={cashflowTypeOptions} placeholder={typesLoading ? "Đang tải..." : "Chọn loại"} loading={typesLoading} />
        </Form.Item>
        <Form.Item label="Thời gian" name="time" rules={[{ required: false }]}>
          <DatePicker showTime style={{ width: "100%" }} placeholder={dayjs().format("DD/MM/YYYY HH:mm")} />
        </Form.Item>

        <Form.Item name="personType" label="Nhóm người nộp">
          <Select
            options={[
              { label: "Nhân viên", value: "staff" },
              { label: "Khách hàng", value: "customer" },
              { label: "Đối tác", value: "supplier" },
              { label: "Khác", value: "other" },
            ]}
            placeholder="Chọn nhóm"
          />
        </Form.Item>

        <Form.Item label="Tên người nộp/nhận" name="relatedPerson">
          <Select
            showSearch
            allowClear
            options={relatedPersonOptions}
            loading={relatedPersonsLoading}
            placeholder={relatedPersonsLoading ? "Đang tải..." : "Chọn hoặc nhập tên"}
            filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            notFoundContent={relatedPersonsLoading ? "Đang tải..." : "Không có dữ liệu"}
          />
        </Form.Item>
        <Form.Item label="Giá trị" name="value" rules={[{ required: true, message: "Nhập giá trị" }]}>
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item label="Ghi chú" name="note">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
