"use client";

import React, { useEffect, useMemo } from "react";
import { ListCashflowRequest } from "@/types-openapi/api";
import { Button, Card, Col, DatePicker, Form, Row, Select } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useCashflowTypes } from "@/hooks/useCashflow";

const { RangePicker } = DatePicker;

export default function CashflowFilter({ onSearch, onReset }: { onSearch: (params: ListCashflowRequest) => void; onReset: () => void }) {
  const [form] = Form.useForm();

  // TODO: replace with real hook to fetch cashflow types when available
  const typeValue = Form.useWatch("type", form);

  // fetch cashflow types for selected type (receipt/payment). Map to Select options.
  const { data: typesData, isLoading: typesLoading } = useCashflowTypes(typeValue === "payment" ? true : typeValue === "receipt" ? false : undefined);

  const cashflowTypeOptions = useMemo(() => {
    if (!typesData?.data) return [];
    return typesData.data.map((t: any) => ({ value: t.id, label: t.name }));
  }, [typesData]);

  // clear cashflowTypeId when 'type' changes
  useEffect(() => {
    form.setFieldsValue({ cashflowTypeId: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeValue]);

  const handleSearch = (values: any) => {
    const params: ListCashflowRequest = {
      isPayment: values.type === "payment" ? true : values.type === "receipt" ? false : undefined,
      from: values.range ? values.range[0].toDate() : undefined,
      to: values.range ? values.range[1].toDate() : undefined,
      cashflowTypeId: values.cashflowTypeId ?? undefined,
      status: values.status ?? undefined,
    };
    onSearch(params);
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSearch} initialValues={{}}>
      <Card
        title="Lọc dữ liệu"
        extra={
          <div className="flex h-full items-center gap-2">
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              Tìm kiếm
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
          </div>
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="type" label="Thu / Chi">
              <Select placeholder="Thu / Chi" allowClear>
                <Select.Option value="receipt">Thu</Select.Option>
                <Select.Option value="payment">Chi</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="range" label="Thời gian">
              <RangePicker showTime style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item name="cashflowTypeId" label="Loại thu chi">
              <Select
                placeholder={typeValue ? "Chọn loại" : "Vui lòng chọn Thu/Chi trước"}
                allowClear
                options={cashflowTypeOptions}
                disabled={!typeValue}
                loading={typesLoading}
              />
            </Form.Item>
          </Col>

          <Col span={4}>
            <Form.Item name="status" label="Trạng thái">
              <Select placeholder="Tất cả" allowClear>
                <Select.Option value="Paid">Đã thanh toán</Select.Option>
                <Select.Option value="Pending">Chờ thanh toán</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );
}
