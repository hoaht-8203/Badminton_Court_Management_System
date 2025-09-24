import { ListCourtRequest } from "@/types-openapi/api";
import { Button, Card, Col, Form, FormProps, Input, Row, Select } from "antd";
import React from "react";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import FormItem from "antd/es/form/FormItem";
import { CourtStatus } from "@/types/commons";
import { useListCourtAreas } from "@/hooks/useCourtArea";

interface SearchCourtProps {
  onSearch: (params: ListCourtRequest) => void;
  onReset: () => void;
}

const SearchCourt = ({ onSearch, onReset }: SearchCourtProps) => {
  const [form] = Form.useForm();

  const { data: courtAreasData } = useListCourtAreas();

  const handleSearch: FormProps<ListCourtRequest>["onFinish"] = (values) => {
    onSearch(values);
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
            <FormItem<ListCourtRequest> label="Tìm kiếm theo tên sân" name="name">
              <Input placeholder="Nhập tên sân" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem<ListCourtRequest> label="Tìm kiếm theo khu vực" name="courtAreaId">
              <Select placeholder="Chọn khu vực" allowClear>
                <Select.Option value={""}>Tất cả</Select.Option>
                {courtAreasData?.data?.map((courtArea) => (
                  <Select.Option key={courtArea.id} value={courtArea.id}>
                    {courtArea.name}
                  </Select.Option>
                ))}
              </Select>
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem<ListCourtRequest> label="Tìm kiếm theo trạng thái" name="status">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Select.Option value={""}>Tất cả</Select.Option>
                <Select.Option value={CourtStatus.Active}>Hoạt động</Select.Option>
                <Select.Option value={CourtStatus.Inactive}>Không hoạt động</Select.Option>
                <Select.Option value={CourtStatus.Maintenance}>Bảo trì</Select.Option>
              </Select>
            </FormItem>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default SearchCourt;
