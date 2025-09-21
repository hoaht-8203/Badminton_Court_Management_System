"use client";

import { ListRoleRequest } from "@/types-openapi/api";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Row } from "antd";
import FormItem from "antd/es/form/FormItem";

interface SearchRolesProps {
  onSearch: (params: ListRoleRequest) => void;
  onReset: () => void;
}

const SearchRoles = ({ onSearch, onReset }: SearchRolesProps) => {
  const [form] = Form.useForm();

  const handleSearch = (values: ListRoleRequest) => {
    onSearch({
      roleName: values.roleName || null,
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
            <FormItem label="Tìm kiếm theo tên vai trò" name="roleName">
              <Input placeholder="Nhập tên vai trò" />
            </FormItem>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default SearchRoles;
