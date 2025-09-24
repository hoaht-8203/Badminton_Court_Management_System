"use client";
import React from "react";
import StaffList from "@/components/quanlysancaulong/staffs/list-staff/staffs-list";
import { useListStaffs } from "@/hooks/useStaffs";

import { Breadcrumb, Button, Card, Col, Form, Input, Row, Select, Radio, Space, message, Avatar, Table, Pagination } from "antd";
import { SearchOutlined, ReloadOutlined, PlusOutlined, FileExcelOutlined } from "@ant-design/icons";
// Dummy roles and status for filter
const roles = [
  { value: "Quản trị viên", label: "Quản trị viên" },
  { value: "Nhân viên", label: "Nhân viên" },
];
const statusOptions = [
  { value: 0, label: "Tất cả" },
  { value: 1, label: "Hoạt động" },
  { value: 2, label: "Không hoạt động" },
];

export default function ListStaffPage() {
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = React.useState({} as any);
  const { data: staffsData, isFetching: loadingStaffs, refetch: refetchStaffs } = useListStaffs(searchParams);

  const handleSearch = (values: any) => {
    setSearchParams({
      keyword: values.keyword ?? null,
      status: values.status !== 0 ? values.status : null,
      // departmentIds, branchIds nếu có
    });
  };

  const handleReset = () => {
    form.resetFields();
    setSearchParams({});
  };

  // Dummy add staff
  const handleAddStaff = () => {
    message.success("Thêm nhân viên mới (demo)");
  };

  // Dummy export excel
  const handleExportExcel = () => {
    message.success("Xuất Excel (demo)");
  };
  return (
    <section style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[{ title: "Quản lý sân cầu lông" }, { title: "Nhân viên" }]} />
      </div>

      <Card
        title="Lọc dữ liệu"
        extra={
          <Space>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit" onClick={() => form.submit()}>
              Tìm kiếm
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSearch} initialValues={{ status: 0 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Tìm kiếm theo tên, email" name="keyword">
                <Input placeholder="Nhập thông tin" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Vai trò" name="role">
                <Select options={roles} allowClear showSearch placeholder="Chọn vai trò" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Trạng thái" name="status">
                <Radio.Group options={statusOptions} optionType="button" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600, color: "#52c41a" }}>Tổng số nhân viên: {staffsData?.data?.length ?? 0}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="primary" icon={<PlusOutlined />}>
            Thêm nhân viên
          </Button>
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetchStaffs()}>
            Tải lại
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
            Xuất Excel
          </Button>
        </div>
      </div>
      <StaffList staffList={staffsData?.data ?? []} />
    </section>
  );
}
