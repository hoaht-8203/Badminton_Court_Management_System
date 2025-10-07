"use client";

import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, DatePicker, Form, FormProps, Input, Row, Select } from "antd";
import dayjs from "dayjs";

interface InventoryFilters {
  code?: string;
  branch?: string;
  range?: [dayjs.Dayjs, dayjs.Dayjs];
  status?: number;
}

interface SearchInventoryProps {
  onSearch: (payload: InventoryFilters) => void;
  onReset: () => void;
}

const SearchInventory = ({ onSearch, onReset }: SearchInventoryProps) => {
  const [form] = Form.useForm<InventoryFilters>();

  const handleSearch: FormProps<InventoryFilters>["onFinish"] = (values) => {
    onSearch({
      code: values.code || undefined,
      branch: values.branch || undefined,
      range: values.range || undefined,
      status: values.status,
    });
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Form layout="vertical" form={form} onFinish={handleSearch}>
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
            <Form.Item name="code" label="Mã kiểm kê">
              <Input allowClear placeholder="Nhập mã kiểm kê" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="branch" label="Chi nhánh">
              <Select placeholder="Chọn chi nhánh" allowClear>
                <Select.Option value="Chi nhánh 1">Chi nhánh 1</Select.Option>
                <Select.Option value="Chi nhánh 2">Chi nhánh 2</Select.Option>
                <Select.Option value="Chi nhánh 3">Chi nhánh 3</Select.Option>
                <Select.Option value="Kho chính">Kho chính</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="status" label="Trạng thái">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Select.Option value={0}>Chờ kiểm kê</Select.Option>
                <Select.Option value={1}>Đã hoàn thành</Select.Option>
                <Select.Option value={2}>Đã hủy</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="range" label="Thời gian kiểm kê">
              <DatePicker.RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default SearchInventory;
