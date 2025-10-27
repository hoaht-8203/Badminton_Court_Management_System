"use client";

import { ListBlogRequest } from "@/types-openapi/api";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, FormProps, Input, Row, Select } from "antd";
import FormItem from "antd/es/form/FormItem";

interface SearchBlogsProps {
  onSearch: (params: ListBlogRequest) => void;
  onReset: () => void;
}

const SearchBlogs = ({ onSearch, onReset }: SearchBlogsProps) => {
  const [form] = Form.useForm();

  const handleSearch: FormProps<ListBlogRequest>["onFinish"] = (values) => {
    onSearch({
      title: values.title || null,
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
          <Col span={12}>
            <FormItem<ListBlogRequest> label="Tìm kiếm theo tiêu đề" name="title">
              <Input placeholder="Nhập tiêu đề blog" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<ListBlogRequest> label="Tìm kiếm theo trạng thái" name="status">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Select.Option value="">Tất cả</Select.Option>
                <Select.Option value="Active">Hoạt động</Select.Option>
                <Select.Option value="Inactive">Không hoạt động</Select.Option>
              </Select>
            </FormItem>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default SearchBlogs;
