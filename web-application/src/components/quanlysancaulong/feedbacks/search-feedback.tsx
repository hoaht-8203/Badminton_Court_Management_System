"use client";

import { ListFeedbackRequest } from "@/types-openapi/api";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, DatePicker, Form, FormProps, Input, Row, Select } from "antd";
import FormItem from "antd/es/form/FormItem";
import dayjs from "dayjs";

interface SearchFeedbackProps {
  onSearch: (params: ListFeedbackRequest) => void;
  onReset: () => void;
}

const { RangePicker } = DatePicker;

const SearchFeedback = ({ onSearch, onReset }: SearchFeedbackProps) => {
  const [form] = Form.useForm();

  const handleSearch: FormProps<any>["onFinish"] = (values) => {
    const [from, to] = values.createdAtRange || [];
    onSearch({
      id: values.id ? Number(values.id) : undefined,
      customerId: values.customerId ? Number(values.customerId) : undefined,
      rating: values.rating ? Number(values.rating) : undefined,
      status: values.status || undefined,
      from: from ? dayjs(from).toDate() : undefined,
      to: to ? dayjs(to).toDate() : undefined,
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
            <FormItem label="ID Feedback" name="id">
              <Input placeholder="Nhập ID feedback" type="number" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem label="ID Khách hàng" name="customerId">
              <Input placeholder="Nhập ID khách hàng" type="number" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem label="Đánh giá" name="rating">
              <Select placeholder="Chọn số sao" allowClear>
                <Select.Option value={1}>1 sao</Select.Option>
                <Select.Option value={2}>2 sao</Select.Option>
                <Select.Option value={3}>3 sao</Select.Option>
                <Select.Option value={4}>4 sao</Select.Option>
                <Select.Option value={5}>5 sao</Select.Option>
              </Select>
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem label="Trạng thái" name="status">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Select.Option value="Active">Hoạt động</Select.Option>
                <Select.Option value="Deleted">Đã xóa</Select.Option>
                <Select.Option value="Hidden">Ẩn</Select.Option>
              </Select>
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16} className="mt-4">
          <Col span={8}>
            <FormItem label="Khoảng thời gian tạo" name="createdAtRange">
              <RangePicker style={{ width: "100%" }} />
            </FormItem>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default SearchFeedback;

