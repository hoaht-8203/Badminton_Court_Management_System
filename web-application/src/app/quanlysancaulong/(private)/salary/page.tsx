"use client";
import dynamic from "next/dynamic";
import React, { useState, useCallback, useMemo, Suspense } from "react";
import { useListPayrolls, useRefreshPayroll } from "@/hooks/usePayroll";
import { FileExcelOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Form, message, Table, Spin } from "antd";
import { ApiError } from "@/lib/axios";

// Dynamically load heavier UI pieces to reduce initial bundle and defer non-critical UI
const PayrollDrawer = dynamic(() => import("@/components/quanlysancaulong/salary/payroll-drawer"), {
  ssr: false,
  loading: () => <Spin />,
});
const SalaryFilter = dynamic(() => import("@/components/quanlysancaulong/salary/salary-filter"), {
  ssr: false,
  loading: () => <Spin />,
});
const SalaryTabs = dynamic(() => import("@/components/quanlysancaulong/salary/salary-tabs"), {
  ssr: false,
  loading: () => <Spin />,
});

export default React.memo(function SalaryPage() {
  // const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const {
    data: payrolls,
    isFetching: loadingPayrolls,
    refetch: refetchPayrolls,
  } = useListPayrolls({ ...searchParams, page: pagination.current, pageSize: pagination.pageSize });
  const refreshMutation = useRefreshPayroll();

  // stable formatter to avoid recreation on every render
  const formatPayrollCode = useCallback((id?: number, pad = 6) => {
    if (id == null) return "";
    return `BL${String(id).padStart(pad, "0")}`;
  }, []);

  const handleSearch = useCallback((values: any) => {
    setSearchParams(values);
  }, []);

  const handleReset = useCallback(() => {
    setSearchParams({});
  }, []);

  const handleAddSalary = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const handleReload = useCallback(
    (id?: number) => {
      if (id) {
        refreshMutation.mutate(id, {
          onSuccess: () => {
            message.success("Tải lại dữ liệu thành công");
          },
          onError: (error: any) => {
            const apiError = error as ApiError;
            if (apiError?.errors) {
              for (const key in apiError.errors) {
                message.error(apiError.errors[key]);
              }
            } else if (apiError?.message) {
              message.error(apiError.message);
            } else {
              message.error("Có lỗi khi tải lại dữ liệu");
            }
          },
        });
      } else {
        // refresh current listing
        refetchPayrolls();
        message.info("Tải lại tất cả bảng lương");
      }
    },
    [refreshMutation, refetchPayrolls],
  );

  const handleExportExcel = useCallback(() => {
    message.info("Xuất Excel (demo)");
  }, []);

  // memoize data and columns to prevent unnecessary re-renders
  const dataSource = useMemo(() => payrolls?.data || [], [payrolls]);

  const columns = useMemo(
    () => [
      { title: "Mã bảng lương", key: "code", render: (_: any, r: any) => formatPayrollCode(r.id) },
      { title: "Tên bảng lương", dataIndex: "name", key: "name" },
      {
        title: "Thời gian làm việc",
        render: (r: any) =>
          `${r.startDate ? new Date(r.startDate).toLocaleDateString() : ""} - ${r.endDate ? new Date(r.endDate).toLocaleDateString() : ""}`,
      },
      { title: "Tổng lương", dataIndex: "totalNetSalary", key: "totalNetSalary" },
      { title: "Đã trả nhân viên", dataIndex: "totalPaidAmount", key: "totalPaidAmount" },
      { title: "Còn lại", render: (r: any) => (r.totalNetSalary ?? 0) - (r.totalPaidAmount ?? 0) },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (text: string) => {
          const s = (text || "").toLowerCase();
          const color = s === "completed" ? "#52c41a" : s === "pending" ? "#faad14" : "#000";
          const label = s === "completed" ? "Đã trả" : s === "pending" ? "Chưa trả xong" : text;
          return <span style={{ color, fontWeight: 600 }}>{label}</span>;
        },
      },
    ],
    [formatPayrollCode],
  );

  // No detail fetch here; SalaryTabs will fetch when expanded (keeps the same data flow)

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb items={[{ title: "Quản lý sân cầu lông" }, { title: "Bảng lương" }]} />
      </div>

      <div className="mb-4">
        <Suspense fallback={<Spin />}>
          <SalaryFilter onSearch={handleSearch} onReset={handleReset} />
        </Suspense>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-green-500">Tổng số bảng lương: {dataSource?.length ?? 0}</span>
        <div className="flex gap-2">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSalary}>
            Thêm bảng tính lương
          </Button>
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => handleReload()}>
            Tải lại
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
            Xuất file
          </Button>
        </div>
      </div>

      <Suspense fallback={<Spin />}>
        <PayrollDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </Suspense>

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loadingPayrolls}
        rowKey="id"
        scroll={{ x: "max-content" }}
        bordered
        expandable={{
          expandRowByClick: true,
          expandedRowRender: (record) => (
            <Suspense fallback={<Spin />}>
              <SalaryTabs payrollId={record.id!} />
            </Suspense>
          ),
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: dataSource?.length ?? 0,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize });
            setSearchParams((s: any) => ({ ...s, page, pageSize }));
          },
        }}
        style={{ marginTop: 8 }}
      />
    </section>
  );
});
