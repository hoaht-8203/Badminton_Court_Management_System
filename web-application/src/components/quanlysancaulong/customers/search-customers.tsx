"use client";

import { ListCustomerRequest } from "@/types-openapi/api";
import { CustomerStatus } from "@/types/commons";
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
          <Col span={6}>
            <FormItem<ListCustomerRequest> label="Tìm kiếm theo thành phố" name="city">
              <Input placeholder="Nhập thành phố" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem<ListCustomerRequest> label="Tìm kiếm theo quận/huyện" name="district">
              <Input placeholder="Nhập quận/huyện" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem<ListCustomerRequest> label="Tìm kiếm theo phường/xã" name="ward">
              <Input placeholder="Nhập phường/xã" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem<ListCustomerRequest> label="Tìm kiếm theo trạng thái" name="status">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Select.Option value={""}>Tất cả</Select.Option>
                <Select.Option value={CustomerStatus.Active}>Hoạt động</Select.Option>
                <Select.Option value={CustomerStatus.Inactive}>Không hoạt động</Select.Option>
              </Select>
            </FormItem>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default SearchCustomers;
