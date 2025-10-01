"use client";
import SalaryFilter from "@/components/quanlysancaulong/salary/salary-filter";
import SalaryList from "@/components/quanlysancaulong/salary/salary-list";
import { useState } from "react";
import { Card, Breadcrumb, Button, message } from "antd";
import { PlusOutlined, ReloadOutlined, FileExcelOutlined } from "@ant-design/icons";

const mockData = [
  {
    code: "BL000001",
    name: "Bảng lương tháng 10/2025",
    payPeriod: "Hàng tháng",
    workDate: "01/10/2025 - 31/10/2025",
    totalSalary: 0,
    paidStaff: 0,
    remaining: 0,
    status: "Tạm tính",
  },
  {
    code: "BL000002",
    name: "Bảng lương tháng 9/2025",
    payPeriod: "Hàng tháng",
    workDate: "01/09/2025 - 30/09/2025",
    totalSalary: 0,
    paidStaff: 0,
    remaining: 0,
    status: "Tạm tính",
  },
];

export default function SalaryPage() {
  const [filter, setFilter] = useState<any>({});
  const [loading, setLoading] = useState(false);
  // TODO: fetch data from API
  const data = mockData;

  const handleSearch = (values: any) => {
    setFilter(values);
    message.info("Tìm kiếm bảng lương (demo)");
  };
  const handleReset = () => {
    setFilter({});
    message.info("Reset filter (demo)");
  };
  const handleAddSalary = () => {
    message.info("Thêm bảng lương (demo)");
  };
  const handleReload = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
    message.info("Tải lại dữ liệu (demo)");
  };
  const handleExportExcel = () => {
    message.info("Xuất Excel (demo)");
  };

  return (
    <section>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[{ title: "Quản lý sân cầu lông" }, { title: "Bảng lương" }]} />
      </div>
      <Card title={<SalaryFilter onSearch={handleSearch} onReset={handleReset} />} style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, color: "#52c41a" }}>Tổng số bảng lương: {data.length}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSalary}>
              + Bảng tính lương
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleReload}>
              Tải lại
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
              Xuất file
            </Button>
          </div>
        </div>
        <SalaryList data={data} loading={loading} />
      </Card>
    </section>
  );
}
