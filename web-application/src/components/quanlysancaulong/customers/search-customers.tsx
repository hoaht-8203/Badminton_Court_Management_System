"use client";

import { ListCustomerRequest } from "@/types-openapi/api";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, FormProps, Input, Row, Select } from "antd";
import FormItem from "antd/es/form/FormItem";

interface SearchCustomersProps {
  onSearch: (params: ListCustomerRequest) => void;
  onReset: () => void;
}

const SearchCustomers = ({ onSearch, onReset }: SearchCustomersProps) => {
  const [form] = Form.useForm();

  const handleSearch: FormProps<ListCustomerRequest>["onFinish"] = (values) => {
    onSearch({
      fullName: values.fullName || null,
      phone: values.phone || null,
      address: values.address || null,
      gender: values.gender || null,
      city: values.city || null,
      district: values.district || null,
      ward: values.ward || null,
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
            <FormItem<ListCustomerRequest> label="Tìm kiếm theo tên khách hàng" name="fullName">
              <Input placeholder="Nhập tên khách hàng" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem<ListCustomerRequest> label="Tìm kiếm theo số điện thoại" name="phone">
              <Input placeholder="Nhập số điện thoại" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem<ListCustomerRequest> label="Tìm kiếm theo địa chỉ" name="address">
              <Input placeholder="Nhập địa chỉ" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem<ListCustomerRequest> label="Tìm kiếm theo giới tính" name="gender">
              <Select placeholder="Chọn giới tính" allowClear>
                <Select.Option value="Nam">Nam</Select.Option>
                <Select.Option value="Nữ">Nữ</Select.Option>
                <Select.Option value="Khác">Khác</Select.Option>
              </Select>
            </FormItem>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default SearchCustomers;
