"use client";
import { Breadcrumb, Button, Form, message, Table } from "antd";
import { PlusOutlined, ReloadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import SalaryFilter from "@/components/quanlysancaulong/salary/salary-filter";
import SalaryTabs from "@/components/quanlysancaulong/salary/salary-tabs";
import PayrollDrawer from "@/components/quanlysancaulong/salary/payroll-drawer";
import { useListPayrolls, useRefreshPayroll } from "@/hooks/usePayroll";

export default function SalaryPage() {
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const {
    data: payrolls,
    isFetching: loadingPayrolls,
    refetch: refetchPayrolls,
  } = useListPayrolls({ ...searchParams, page: pagination.current, pageSize: pagination.pageSize });
  const refreshMutation = useRefreshPayroll();

  const formatPayrollCode = (id?: number, pad = 6) => {
    if (id == null) return "";
    return `BL${String(id).padStart(pad, "0")}`;
  };

  const handleSearch = (values: any) => {
    setSearchParams(values);
    message.info("Tìm kiếm bảng lương");
  };
  const handleReset = () => {
    setSearchParams({});
    message.info("Reset filter");
  };
  const handleAddSalary = () => {
    setDrawerOpen(true);
  };
  const handleReload = (id?: number) => {
    if (id) {
      refreshMutation.mutate(id);
    } else {
      // refresh current listing
      refetchPayrolls();
      message.info("Tải lại tất cả bảng lương");
    }
  };
  const handleExportExcel = () => {
    message.info("Xuất Excel (demo)");
  };

  // Không fetch detail ở đây, SalaryTabs sẽ tự fetch khi expand

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb items={[{ title: "Quản lý sân cầu lông" }, { title: "Bảng lương" }]} />
      </div>

      <div className="mb-4">
        <SalaryFilter onSearch={handleSearch} onReset={handleReset} />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-green-500">Tổng số bảng lương: {payrolls?.data?.length ?? 0}</span>
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

      <PayrollDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Table
        columns={[
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
        ]}
        dataSource={payrolls?.data || []}
        loading={loadingPayrolls}
        rowKey="id"
        scroll={{ x: "max-content" }}
        bordered
        expandable={{
          expandRowByClick: true,
          expandedRowRender: (record) => <SalaryTabs payrollId={record.id} />,
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: payrolls?.data?.length ?? 0,
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
}
