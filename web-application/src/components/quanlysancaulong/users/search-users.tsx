"use client";

import { ListAdministratorRequest } from "@/types-openapi/api";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Row, Select } from "antd";
import FormItem from "antd/es/form/FormItem";
import RadioGroup from "antd/es/radio/group";
import { ApplicationUserStatus } from "@/types/commons";
import { useListRoles } from "@/hooks";

interface SearchUserProps {
  onSearch: (params: ListAdministratorRequest) => void;
  onReset: () => void;
}

const SearchUser = ({ onSearch, onReset }: SearchUserProps) => {
  const [form] = Form.useForm();
  const { data: rolesData, isLoading: loadingRolesData } = useListRoles({
    roleName: null,
  });

  const handleSearch = (values: ListAdministratorRequest) => {
    onSearch({
      keyword: values.keyword || null,
      role: values.role || null,
      status: values.status ? values.status.toString() : null,
    });
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Card title="Lọc dữ liệu">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSearch}
        initialValues={{
          status: 0,
        }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <FormItem label="Tìm kiếm theo tên người dùng, email" name="keyword">
              <Input placeholder="Nhập thông tin" />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem label="Vai trò" name="role">
              <Select
                style={{ width: "100%" }}
                allowClear
                showSearch
                options={rolesData?.data?.map((role) => ({
                  value: role.roleName,
                  label: role.roleName,
                }))}
                placeholder="Chọn vai trò"
                loading={loadingRolesData}
              />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem label="Trạng thái" name="status">
              <RadioGroup
                options={[
                  { value: 0, label: "Tất cả" },
                  { value: ApplicationUserStatus.Active, label: "Hoạt động" },
                  {
                    value: ApplicationUserStatus.Inactive,
                    label: "Không hoạt động",
                  },
                ]}
              />
            </FormItem>
          </Col>
          <Col span={6}>
            <div className="flex h-full items-center gap-2">
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                Tìm kiếm
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default SearchUser;
