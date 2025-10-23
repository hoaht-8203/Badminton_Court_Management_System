"use client";

import { ListOrderRequest } from "@/types-openapi/api";
import { Button, Card, Col, DatePicker, Form, Input, Row, Select } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useState } from "react";

interface SearchOrdersProps {
  onSearch: (params: ListOrderRequest) => void;
  onReset: () => void;
}

const SearchOrders = ({ onSearch, onReset }: SearchOrdersProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      const searchParams: ListOrderRequest = {
        status: values.status || undefined,
        paymentMethod: values.paymentMethod || undefined,
        customerId: values.customerId || undefined,
        fromDate: values.dateRange?.[0]?.toDate() || undefined,
        toDate: values.dateRange?.[1]?.toDate() || undefined,
      };
      onSearch(searchParams);
    } catch (error) {
      console.error("Validation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Card size="small" className="mb-4">
      <Form form={form} layout="vertical" onFinish={handleSearch}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Trạng thái" name="status">
              <Select
                placeholder="Chọn trạng thái"
                allowClear
                options={[
                  { label: "Chờ thanh toán", value: "Pending" },
                  { label: "Đã thanh toán", value: "Paid" },
                  { label: "Đã hủy", value: "Cancelled" },
                  { label: "Đã hoàn tiền", value: "Refunded" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Phương thức thanh toán" name="paymentMethod">
              <Select
                placeholder="Chọn phương thức"
                allowClear
                options={[
                  { label: "Tiền mặt", value: "Cash" },
                  { label: "Chuyển khoản", value: "BankTransfer" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Mã khách hàng" name="customerId">
              <Input placeholder="Nhập mã khách hàng" type="number" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Khoảng thời gian" name="dateRange">
              <DatePicker.RangePicker placeholder={["Từ ngày", "Đến ngày"]} style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <div className="flex gap-2">
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
                Tìm kiếm
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Làm mới
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default SearchOrders;
