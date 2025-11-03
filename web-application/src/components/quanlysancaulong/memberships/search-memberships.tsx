"use client";

import { ListMembershipRequest } from "@/types-openapi/api";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Radio, Row, Select } from "antd";
import FormItem from "antd/es/form/FormItem";

interface SearchMembershipProps {
  onSearch: (params: ListMembershipRequest) => void;
  onReset: () => void;
}

const SearchMembership = ({ onSearch, onReset }: SearchMembershipProps) => {
  const [form] = Form.useForm();

  const handleSearch = (values: any) => {
    const params: ListMembershipRequest = {
      name: values.name || undefined,
      status: values.status || undefined,
    };
    onSearch(params);
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
            <FormItem label="Tên gói" name="name">
              <Input placeholder="Nhập tên gói" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem label="Trạng thái" name="status">
              <Select
                allowClear
                placeholder="Chọn trạng thái"
                options={[
                  { value: "Active", label: "Hoạt động" },
                  { value: "Inactive", label: "Không hoạt động" },
                ]}
              />
            </FormItem>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default SearchMembership;
