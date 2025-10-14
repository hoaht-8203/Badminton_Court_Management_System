"use client";

import { ListServiceRequest } from "@/types-openapi/api";
import { ServiceStatus } from "@/types/commons";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, FormProps, Input, Row, Select } from "antd";
import FormItem from "antd/es/form/FormItem";

interface SearchServicesProps {
  onSearch: (params: ListServiceRequest) => void;
  onReset: () => void;
}

const SearchServices = ({ onSearch, onReset }: SearchServicesProps) => {
  const [form] = Form.useForm();

  const handleSearch: FormProps<ListServiceRequest>["onFinish"] = (values) => {
    onSearch({
      name: values.name || null,
      category: values.category || null,
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
          <Col span={8}>
            <FormItem<ListServiceRequest> label="Tìm kiếm theo tên dịch vụ" name="name">
              <Input placeholder="Nhập tên dịch vụ" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<ListServiceRequest> label="Tìm kiếm theo danh mục" name="category">
              <Select placeholder="Chọn danh mục" allowClear>
                <Select.Option value="Equipment">Thiết bị</Select.Option>
                <Select.Option value="Referee">Trọng tài</Select.Option>
                <Select.Option value="Clothing">Quần áo</Select.Option>
                <Select.Option value="Other">Khác</Select.Option>
              </Select>
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem<ListServiceRequest> label="Tìm kiếm theo trạng thái" name="status">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Select.Option value={""}>Tất cả</Select.Option>
                <Select.Option value={ServiceStatus.Active}>Hoạt động</Select.Option>
                <Select.Option value={ServiceStatus.Inactive}>Không hoạt động</Select.Option>
              </Select>
            </FormItem>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default SearchServices;
