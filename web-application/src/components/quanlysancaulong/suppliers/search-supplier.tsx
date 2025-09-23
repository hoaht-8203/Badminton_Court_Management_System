"use client";

import { ListSupplierRequest } from "@/types-openapi/api";
import { SupplierStatus } from "@/types/commons";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, FormProps, Input, Row, Select } from "antd";
import FormItem from "antd/es/form/FormItem";

interface SearchSupplierProps {
  onSearch: (params: ListSupplierRequest) => void;
  onReset: () => void;
}

const SearchSupplier = ({ onSearch, onReset }: SearchSupplierProps) => {
  const [form] = Form.useForm();

  const handleSearch: FormProps<ListSupplierRequest>["onFinish"] = (values) => {
    onSearch({
      id: values.id ?? null,
      name: values.name || null,
      phone: values.phone || null,
      status: values.status || null,
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
            <FormItem<ListSupplierRequest> label="Mã NCC" name="id">
              <Input type="number" placeholder="Nhập mã nhà cung cấp" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem<ListSupplierRequest> label="Tên nhà cung cấp" name="name">
              <Input placeholder="Nhập tên nhà cung cấp" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem<ListSupplierRequest> label="Số điện thoại" name="phone">
              <Input placeholder="Nhập số điện thoại" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem<ListSupplierRequest> label="Trạng thái" name="status">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Select.Option value={""}>Tất cả</Select.Option>
                <Select.Option value={SupplierStatus.Active}>Hoạt động</Select.Option>
                <Select.Option value={SupplierStatus.Inactive}>Không hoạt động</Select.Option>
              </Select>
            </FormItem>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default SearchSupplier;
