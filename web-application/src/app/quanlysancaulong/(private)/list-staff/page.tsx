"use client";
import StaffModal from "@/components/quanlysancaulong/staffs/list-staff/staff-modal";
import StaffList from "@/components/quanlysancaulong/staffs/list-staff/staffs-list";
import { useChangeStaffStatus, useCreateStaff, useListStaffs, useUpdateStaff } from "@/hooks/useStaffs";
import { useState } from "react";

import { ListStaffRequest, ListStaffRequestFromJSON, StaffRequest } from "@/types-openapi/api";
import { FileExcelOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Col, Form, Input, Radio, Row, Select, message } from "antd";
// Dummy roles and status for filter
const branches = [
  { value: 1, label: "Chi nhánh A" },
  { value: 2, label: "Chi nhánh B" },
];
const departments = [
  { value: 1, label: "Phòng ban A" },
  { value: 2, label: "Phòng ban B" },
];
const statusOptions = [
  { value: 0, label: "Tất cả" },
  { value: 1, label: "Đang làm việc" },
  { value: 2, label: "Đã nghỉ việc" },
];

export default function ListStaffPage() {
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useState(ListStaffRequestFromJSON({}));
  const { data: staffsData, isFetching: loadingStaffs, refetch: refetchStaffs } = useListStaffs(searchParams);
  const [openStaffModal, setOpenStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // CRUD hooks
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff(editingStaff?.id);
  const changeStaffStatus = useChangeStaffStatus();

  const handleChangeStaffStatus = async (staffId: number, isActive: boolean) => {
    try {
      await changeStaffStatus.mutateAsync({ staffId, isActive });
      message.success("Đổi trạng thái nhân viên thành công");
    } catch (error: any) {
      message.error(error?.message || "Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleSearch = (values: ListStaffRequest) => {
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

  const handleAddStaff = () => {
    setEditingStaff(null);
    setOpenStaffModal(true);
  };

  const handleEditStaff = (staff: StaffRequest) => {
    setEditingStaff(staff);
    setOpenStaffModal(true);
  };

  const handleStaffModalClose = () => {
    setOpenStaffModal(false);
    setEditingStaff(null);
  };

  const handleStaffModalSubmit = async (values: StaffRequest) => {
    try {
      if (editingStaff && editingStaff.id) {
        await updateStaff.mutateAsync(values);
        message.success("Cập nhật nhân viên thành công");
      } else {
        await createStaff.mutateAsync(values);
        message.success("Thêm nhân viên thành công");
      }
      setOpenStaffModal(false);
      setEditingStaff(null);
    } catch (error: any) {
      message.error(error?.message || "Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleExportExcel = () => {
    message.success("Xuất Excel (demo)");
  };
  return (
    <section>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[{ title: "Quản lý sân cầu lông" }, { title: "Nhân viên" }]} />
      </div>

      <Card
        title={
          <Form form={form} layout="inline" onFinish={handleSearch} initialValues={{ status: 0 }} style={{ marginBottom: 0 }}>
            <Form.Item label="Tìm kiếm theo tên, email" name="keyword" style={{ marginRight: 8 }}>
              <Input placeholder="Nhập thông tin" allowClear style={{ width: 440 }} />
            </Form.Item>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit" style={{ marginRight: 8 }}>
              Tìm kiếm
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset} style={{ marginRight: 8 }}>
              Reset
            </Button>
            <Button type="dashed" onClick={() => setShowAdvancedFilter((f) => !f)}>
              {showAdvancedFilter ? "Ẩn lọc nâng cao" : "Lọc nâng cao"}
            </Button>
          </Form>
        }
        style={{ marginBottom: 16 }}
        styles={{ body: { paddingTop: showAdvancedFilter ? 16 : 0, paddingBottom: showAdvancedFilter ? 16 : 0 } }}
      >
        {showAdvancedFilter && (
          <Form form={form} layout="vertical" onFinish={handleSearch} initialValues={{ status: 0 }}>
            <Row gutter={28} align="middle">
              <Col span={8}>
                <Form.Item label="Chi nhánh" name="branchId">
                  <Select options={branches} allowClear showSearch placeholder="Chọn chi nhánh" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Phòng ban" name="departmentId">
                  <Select options={departments} allowClear showSearch placeholder="Chọn phòng ban" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Trạng thái" name="status">
                  <Radio.Group options={statusOptions} optionType="button" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Card>

      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600, color: "#52c41a" }}>Tổng số nhân viên: {staffsData?.data?.length ?? 0}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddStaff}>
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
      <StaffList staffList={staffsData?.data ?? []} onEditStaff={handleEditStaff} onChangeStaffStatus={handleChangeStaffStatus} />
      <StaffModal open={openStaffModal} onClose={handleStaffModalClose} onSubmit={handleStaffModalSubmit} staff={editingStaff} />
    </section>
  );
}
