"use client";

import React, { useEffect } from "react";
import { ListCashflowRequest } from "@/types-openapi/api";
import { Button, Card, Col, DatePicker, Form, Row, Select } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;

export default function CashflowFilter({ onSearch, onReset }: { onSearch: (params: ListCashflowRequest) => void; onReset: () => void }) {
  const [form] = Form.useForm();

  // TODO: replace with real hook to fetch cashflow types when available
  const cashflowTypeOptions: { value: number; label: string }[] = [];

  useEffect(() => {
    // placeholder: if you add a hook like useListCashflowTypes, call it here and set options
  }, []);

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
              <Select placeholder="Chọn loại" allowClear options={cashflowTypeOptions} />
            </Form.Item>
          </Col>

          <Col span={4}>
            <Form.Item name="status" label="Trạng thái">
              <Select placeholder="Trạng thái" allowClear>
                <Select.Option value="paid">Đã thanh toán</Select.Option>
                <Select.Option value="pending">Chờ</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );
}
