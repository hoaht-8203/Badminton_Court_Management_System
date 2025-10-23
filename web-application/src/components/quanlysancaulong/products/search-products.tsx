"use client";

import { ListProductRequest } from "@/types-openapi/api";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, FormProps, Input, Row, Select } from "antd";
import { useListCategories } from "@/hooks/useCategories";

interface ProductFilters extends ListProductRequest {
  priceSort?: "ascend" | "descend";
  isActive?: boolean;
}

interface SearchProductsProps {
  onSearch: (payload: ProductFilters) => void;
  onReset: () => void;
}

const SearchProducts = ({ onSearch, onReset }: SearchProductsProps) => {
  const [form] = Form.useForm<ProductFilters>();
  const { data: categoriesData } = useListCategories({});

  const handleSearch: FormProps<ProductFilters>["onFinish"] = (values) => {
    onSearch({
      id: values.id || undefined,
      code: values.code || undefined,
      name: values.name || undefined,
      category: values.category || undefined,
      menuType: values.menuType || undefined,
      isActive: typeof values.isActive === "boolean" ? values.isActive : undefined,
      priceSort: values.priceSort,
    });
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Form layout="vertical" form={form} onFinish={handleSearch}>
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
            <Form.Item<ProductFilters> label="Tìm theo mã code" name="code">
              <Input placeholder="Nhập mã code" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item<ProductFilters> label="Tìm theo tên hàng" name="name">
              <Input placeholder="Nhập tên hàng" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item<ProductFilters> label="Tìm theo nhóm hàng" name="category">
              <Select
                allowClear
                showSearch
                placeholder="Chọn nhóm hàng"
                optionFilterProp="label"
                filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                options={(categoriesData?.data || []).map((c: any) => ({
                  label: c.name,
                  value: c.name,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item<ProductFilters> label="Loại thực đơn" name="menuType">
              <Select allowClear placeholder="Chọn loại">
                <Select.Option value="Đồ ăn">Đồ ăn</Select.Option>
                <Select.Option value="Đồ uống">Đồ uống</Select.Option>
                <Select.Option value="Khác">Khác</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item<ProductFilters> label="Sắp xếp giá" name="priceSort">
              <Select allowClear placeholder="Chọn sắp xếp">
                <Select.Option value="ascend">Giá thấp → cao</Select.Option>
                <Select.Option value="descend">Giá cao → thấp</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item<ProductFilters> label="Trạng thái kinh doanh" name="isActive">
              <Select allowClear placeholder="Chọn trạng thái">
                <Select.Option value={true as unknown as string}>Đang hoạt động</Select.Option>
                <Select.Option value={false as unknown as string}>Ngừng hoạt động</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default SearchProducts;
