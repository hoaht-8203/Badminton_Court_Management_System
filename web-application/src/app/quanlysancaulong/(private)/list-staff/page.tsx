"use client";
import dynamic from "next/dynamic";
import React, { useCallback, useMemo, useState, Suspense } from "react";
import { useChangeStaffStatus, useCreateStaff, useListStaffs, useUpdateStaff } from "@/hooks/useStaffs";
import { ApiError } from "@/lib/axios";

import { ListStaffRequest, ListStaffRequestFromJSON, StaffRequest } from "@/types-openapi/api";
import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Col, Form, Input, Radio, Row, message, Spin } from "antd";

const StaffList = dynamic(() => import("@/components/quanlysancaulong/staffs/list-staff/staffs-list"), {
  ssr: false,
  loading: () => <Spin />,
});
const StaffModal = dynamic(() => import("@/components/quanlysancaulong/staffs/list-staff/staff-modal"), {
  ssr: false,
  loading: () => <Spin />,
});
// Dummy status for filter
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
  const [activeTab, setActiveTab] = useState<string>("info");
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

  const handleSearch = useCallback((values: any) => {
    // Backend expects: 1 = active, 0 = inactive. UI uses 2 = "Đã nghỉ việc".
    // Map UI value 2 -> backend 0. Keep 0 as 'all' -> null.
    const mappedStatus = values.status === 0 ? null : values.status === 2 ? 0 : values.status;
    // Compose keyword from name and phone so backend can search both
    const parts: string[] = [];
    if (values.name) parts.push(values.name);
    if (values.phone) parts.push(values.phone);
    const keyword = parts.length ? parts.join(" ") : null;
    setSearchParams({
      keyword: keyword,
      status: mappedStatus,
    });
  }, []);

  const handleReset = useCallback(() => {
    form.resetFields();
    setSearchParams({});
  }, [form]);

  const handleAddStaff = useCallback(() => {
    setEditingStaff(null);
    setActiveTab("info");
    setOpenStaffModal(true);
  }, []);

  const handleEditStaff = useCallback((staff: StaffRequest, tab?: string) => {
    setEditingStaff(staff);
    setActiveTab(tab || "info");
    setOpenStaffModal(true);
  }, []);

  const handleStaffModalClose = useCallback(() => {
    setOpenStaffModal(false);
    setEditingStaff(null);
    setActiveTab("info");
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
        // error is ApiError from axios interceptor
        const apiError = error as ApiError;
        if (apiError?.errors) {
          // Hiển thị các field errors
          for (const key in apiError.errors) {
            message.error(apiError.errors[key]);
          }
        } else if (apiError?.message) {
          // Hiển thị message từ API
          message.error(apiError.message);
        } else {
          message.error("Có lỗi xảy ra, vui lòng thử lại");
        }
      }
    },
    [createStaff, updateStaff, editingStaff],
  );

  return (
    <section>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[{ title: "Quản lý sân cầu lông" }, { title: "Nhân viên" }]} />
      </div>

      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ fontWeight: 600 }}>Tìm kiếm nhân viên</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => form.submit()} style={{ marginRight: 8 }}>
                Tìm kiếm
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
        }
        style={{ marginBottom: 16 }}
        styles={{ body: { paddingTop: showAdvancedFilter ? 16 : 0, paddingBottom: showAdvancedFilter ? 16 : 0 } }}
      >
        {showAdvancedFilter && (
          <Form form={form} layout="vertical" onFinish={handleSearch} initialValues={{ status: 0 }}>
            <Row gutter={28} align="middle">
              <Col span={12}>
                <Form.Item label="Tên" name="name">
                  <Input placeholder="Nhập tên" allowClear />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Số điện thoại" name="phone">
                  <Input placeholder="Nhập số điện thoại" allowClear />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={28} align="middle">
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
        </div>
      </div>
      <Suspense fallback={<Spin />}>
        <StaffList staffList={staffList} onEditStaff={handleEditStaff} onChangeStaffStatus={handleChangeStaffStatus} />
      </Suspense>
      <Suspense fallback={<Spin />}>
        <StaffModal
          open={openStaffModal}
          onClose={handleStaffModalClose}
          onSubmit={handleStaffModalSubmit}
          staff={editingStaff}
          activeTab={activeTab}
        />
      </Suspense>
    </section>
  );
});
