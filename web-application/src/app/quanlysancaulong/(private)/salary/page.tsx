"use client";
import { Breadcrumb, Button, message, Table } from "antd";
import { PlusOutlined, ReloadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { useState } from "react";
import SalaryFilter from "@/components/quanlysancaulong/salary/salary-filter";
import SalaryTabs from "@/components/quanlysancaulong/salary/salary-tabs";

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
    slips: [{ name: "Phiếu lương demo", amount: 0 }],
    history: [
      { date: "2025-10-01", action: "Tạo bảng lương", user: "Kim Tu Dan", amount: 0 },
      { date: "2025-10-05", action: "Chốt lương", user: "Admin", amount: 0 },
    ],
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
    slips: [{ name: "Phiếu lương demo", amount: 0 }],
    history: [
      { date: "2025-09-01", action: "Tạo bảng lương", user: "Kim Tu Dan", amount: 0 },
      { date: "2025-09-05", action: "Chốt lương", user: "Admin", amount: 0 },
    ],
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
      <div className="mb-4">
        <Breadcrumb items={[{ title: "Quản lý sân cầu lông" }, { title: "Bảng lương" }]} />
      </div>

      <div className="mb-4">
        <SalaryFilter onSearch={handleSearch} onReset={handleReset} />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-green-500">Tổng số bảng lương: {data.length}</span>
        <div className="flex gap-2">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSalary}>
            Thêm bảng tính lương
          </Button>
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleReload}>
            Tải lại
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
            Xuất file
          </Button>
        </div>
      </div>

      <Table
        columns={[
          { title: "Mã bảng lương", dataIndex: "code", key: "code" },
          { title: "Tên bảng lương", dataIndex: "name", key: "name" },
          { title: "Kỳ lương", dataIndex: "payPeriod", key: "payPeriod" },
          { title: "Thời gian làm việc", dataIndex: "workDate", key: "workDate" },
          { title: "Tổng lương", dataIndex: "totalSalary", key: "totalSalary" },
          { title: "Đã trả nhân viên", dataIndex: "paidStaff", key: "paidStaff" },
          { title: "Còn lại", dataIndex: "remaining", key: "remaining" },
          {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (text: string) => <span style={{ color: "#52c41a", fontWeight: 600 }}>{text}</span>,
          },
        ]}
        dataSource={data}
        loading={loading}
        rowKey="code"
        scroll={{ x: "max-content" }}
        bordered
        expandable={{
          expandRowByClick: true,
          expandedRowRender: (record) => <SalaryTabs salary={record} />,
        }}
        pagination={false}
        style={{ marginTop: 8 }}
      />
    </section>
  );
}
