"use client";

import { VoucherResponse } from "@/types-openapi/api";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, DatePicker, Form, FormProps, Input, Row, Select } from "antd";
import FormItem from "antd/es/form/FormItem";
import dayjs from "dayjs";

interface SearchVoucherProps {
  onSearch: (params: Partial<VoucherResponse> & { startAtFrom?: Date | null; startAtTo?: Date | null }) => void;
  onReset: () => void;
}

const { RangePicker } = DatePicker;

const SearchVoucher = ({ onSearch, onReset }: SearchVoucherProps) => {
  const [form] = Form.useForm();

  const handleSearch: FormProps<any>["onFinish"] = (values) => {
    const [from, to] = values.startAtRange || [];
    onSearch({
      code: values.code || undefined,
      title: values.title || undefined,
      discountType: values.discountType || undefined,
      isActive: values.isActive === "" ? undefined : values.isActive === "active" ? true : values.isActive === "inactive" ? false : undefined,
      startAtFrom: from ? dayjs(from).toDate() : undefined,
      startAtTo: to ? dayjs(to).toDate() : undefined,
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
            <FormItem label="Mã mã giảm giá" name="code">
              <Input placeholder="Nhập mã voucher" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem label="Tiêu đề" name="title">
              <Input placeholder="Nhập tiêu đề hoặc mô tả" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem label="Loại giảm giá" name="discountType">
              <Input placeholder="Nhập loại giảm (ví dụ: Amount, Percentage)" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem label="Trạng thái" name="isActive">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Select.Option value="">Tất cả</Select.Option>
                <Select.Option value="active">Hoạt động</Select.Option>
                <Select.Option value="inactive">Không hoạt động</Select.Option>
              </Select>
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16} className="mt-4">
          <Col span={8}>
            <FormItem label="Khoảng thời gian bắt đầu" name="startAtRange">
              <RangePicker style={{ width: "100%" }} />
            </FormItem>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default SearchVoucher;
