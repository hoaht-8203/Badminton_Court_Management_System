import { Table } from "antd";
import SalaryDetailPanel from "./salary-detail-panel";

export default function SalaryList({ data, loading }: { data: any[]; loading?: boolean }) {
  const columns = [
    { title: "Mã", dataIndex: "code", key: "code", width: 120 },
    { title: "Tên", dataIndex: "name", key: "name", width: 240 },
    { title: "Kỳ hạn trả", dataIndex: "payPeriod", key: "payPeriod", width: 120 },
    { title: "Kỳ làm việc", dataIndex: "workDate", key: "workDate", width: 220 },
    { title: "Tổng lương", dataIndex: "totalSalary", key: "totalSalary", width: 120 },
    { title: "Đã trả nhân viên", dataIndex: "paidStaff", key: "paidStaff", width: 120 },
    { title: "Còn cần trả", dataIndex: "remaining", key: "remaining", width: 120 },
    { title: "Trạng thái", dataIndex: "status", key: "status", width: 120 },
  ];
  return (
    <Table
      rowKey="code"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      expandable={{
        expandedRowRender: (record) => <SalaryDetailPanel salary={record} />,
        rowExpandable: () => true,
      }}
      style={{ marginTop: 8 }}
    />
  );
}
