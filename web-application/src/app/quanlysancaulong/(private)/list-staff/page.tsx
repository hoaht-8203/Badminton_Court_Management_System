"use client";
import dynamic from "next/dynamic";
import React, { useCallback, useMemo, useState, Suspense } from "react";
import { useChangeStaffStatus, useCreateStaff, useListStaffs, useUpdateStaff } from "@/hooks/useStaffs";

import { ListStaffRequest, ListStaffRequestFromJSON, StaffRequest } from "@/types-openapi/api";
import { FileExcelOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Col, Form, Input, Radio, Row, Select, message, Spin } from "antd";

const StaffList = dynamic(() => import("@/components/quanlysancaulong/staffs/list-staff/staffs-list"), {
  ssr: false,
  loading: () => <Spin />,
});
const StaffModal = dynamic(() => import("@/components/quanlysancaulong/staffs/list-staff/staff-modal"), {
  ssr: false,
  loading: () => <Spin />,
});
// Dummy roles and status for filter
const departments = [
  { value: 1, label: "Phòng ban A" },
  { value: 2, label: "Phòng ban B" },
];
const statusOptions = [
  { value: 0, label: "Tất cả" },
  { value: 1, label: "Đang làm việc" },
  { value: 2, label: "Đã nghỉ việc" },
];

export default React.memo(function ListStaffPage() {
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useState(ListStaffRequestFromJSON({}));
  const { data: staffsData, isFetching: loadingStaffs, refetch: refetchStaffs } = useListStaffs(searchParams);
  const [openStaffModal, setOpenStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  // show advanced filter by default (no branch filter available yet)
  const [showAdvancedFilter] = useState(true);

  // CRUD hooks
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff(editingStaff?.id);
  const changeStaffStatus = useChangeStaffStatus();

  const staffList = useMemo(() => staffsData?.data ?? [], [staffsData]);

  const handleChangeStaffStatus = useCallback(
    async (staffId: number, isActive: boolean) => {
      try {
        await changeStaffStatus.mutateAsync({ staffId, isActive });
        message.success("Đổi trạng thái nhân viên thành công");
      } catch (error: any) {
        message.error(error?.message || "Có lỗi xảy ra, vui lòng thử lại");
      }
    },
    [changeStaffStatus],
  );

  const handleSearch = useCallback((values: ListStaffRequest) => {
    // Backend expects: 1 = active, 0 = inactive. UI uses 2 = "Đã nghỉ việc".
    // Map UI value 2 -> backend 0. Keep 0 as 'all' -> null.
    const mappedStatus = values.status === 0 ? null : values.status === 2 ? 0 : values.status;
    setSearchParams({
      keyword: values.keyword ?? null,
      status: mappedStatus,
      // departmentIds, branchIds nếu có
    });
  }, []);

  const handleReset = useCallback(() => {
    form.resetFields();
    setSearchParams({});
  }, [form]);

  const handleAddStaff = useCallback(() => {
    setEditingStaff(null);
    setOpenStaffModal(true);
  }, []);

  const handleEditStaff = useCallback((staff: StaffRequest) => {
    setEditingStaff(staff);
    setOpenStaffModal(true);
  }, []);

  const handleStaffModalClose = useCallback(() => {
    setOpenStaffModal(false);
    setEditingStaff(null);
  }, []);

  const handleStaffModalSubmit = useCallback(
    async (values: StaffRequest) => {
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
    },
    [createStaff, updateStaff, editingStaff],
  );

  const handleExportExcel = useCallback(() => {
    message.success("Xuất Excel (demo)");
  }, []);

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
            {/* Advanced filter always shown */}
          </Form>
        }
        style={{ marginBottom: 16 }}
        styles={{ body: { paddingTop: showAdvancedFilter ? 16 : 0, paddingBottom: showAdvancedFilter ? 16 : 0 } }}
      >
        {showAdvancedFilter && (
          <Form form={form} layout="vertical" onFinish={handleSearch} initialValues={{ status: 0 }}>
            <Row gutter={28} align="middle">
              <Col span={12}>
                <Form.Item label="Phòng ban" name="departmentId">
                  <Select options={departments} allowClear showSearch placeholder="Chọn phòng ban" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Trạng thái" name="status">
                  <Radio.Group options={statusOptions} optionType="button" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Card>

      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600, color: "#52c41a" }}>Tổng số nhân viên: {staffList?.length ?? 0}</span>
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
      <Suspense fallback={<Spin />}>
        <StaffList staffList={staffList} onEditStaff={handleEditStaff} onChangeStaffStatus={handleChangeStaffStatus} />
      </Suspense>
      <Suspense fallback={<Spin />}>
        <StaffModal open={openStaffModal} onClose={handleStaffModalClose} onSubmit={handleStaffModalSubmit} staff={editingStaff} />
      </Suspense>
    </section>
  );
});
