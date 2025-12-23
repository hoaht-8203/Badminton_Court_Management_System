"use client";

import { ListSliderRequest } from "@/types-openapi/api";
import { Button, Col, Form, Input, Row, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";

interface SearchSlidersProps {
  onSearch: (params: ListSliderRequest) => void;
  onReset: () => void;
}

const SearchSliders = ({ onSearch, onReset }: SearchSlidersProps) => {
  const [form] = Form.useForm();

  const handleSearch = (values: ListSliderRequest) => {
    const params: ListSliderRequest = {
      title: values.title?.trim() ? values.title.trim() : null,
      status: values.status ?? null,
    };

    onSearch(params);
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <div className="rounded bg-white p-4 shadow">
      <Form form={form} onFinish={handleSearch} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="title" label="Tiêu đề">
              <Input placeholder="Tìm kiếm theo tiêu đề" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="status" label="Trạng thái">
              <Select
                placeholder="Chọn trạng thái"
                allowClear
                options={[
                  { value: "Active", label: "Đang hoạt động" },
                  { value: "Inactive", label: "Không hoạt động" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label=" ">
              <div className="flex gap-2">
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  Tìm kiếm
                </Button>
                <Button onClick={handleReset}>Đặt lại</Button>
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default SearchSliders;
