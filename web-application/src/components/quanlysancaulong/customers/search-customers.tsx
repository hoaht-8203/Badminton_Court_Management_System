"use client";

import { ListCustomerRequest } from "@/types-openapi/api";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Row } from "antd";
import FormItem from "antd/es/form/FormItem";

interface SearchCustomersProps {
  onSearch: (params: ListCustomerRequest) => void;
  onReset: () => void;
}

const SearchCustomers = ({ onSearch, onReset }: SearchCustomersProps) => {
  const [form] = Form.useForm();

  const handleSearch = (values: ListCustomerRequest) => {
    onSearch({
      fullName: values.fullName || null,
    });
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSearch}>
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
            <FormItem label="Tìm kiếm theo tên khách hàng" name="fullName">
              <Input placeholder="Nhập tên khách hàng" />
            </FormItem>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default SearchCustomers;
