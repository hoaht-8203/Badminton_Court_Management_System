import { Avatar, Pagination, Table, Tabs } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useState } from "react";
import DebtAdvanceTab from "./debt-advance-tab";
import SalaryConfigTab from "./salary-config-tab";
import SalarySlipTab from "./salary-slip-tab";
import StaffInfoTab from "./staff-info-tab";
import WorkScheduleTab from "./work-schedule-tab";

const getColumns = (): ColumnsType<any> => [
  {
    title: "Mã nhân viên",
    dataIndex: "id",
    key: "id",
    render: (text: string, record: any) => (
      <div style={{ display: "flex", alignItems: "center" }}>
        <Avatar src={record.avatarUrl ? record.avatarUrl : undefined} />
        <span style={{ marginLeft: 8 }}>{`NV${String(text).padStart(6, "0")}`}</span>
      </div>
    ),
  },
  {
    title: "Tên nhân viên",
    dataIndex: "fullName",
    key: "fullName",
  },
  {
    title: "Số điện thoại",
    dataIndex: "phoneNumber",
    key: "phoneNumber",
  },
  {
    title: "Số CMND/CCCD",
    dataIndex: "identificationNumber",
    key: "identificationNumber",
  },
];

interface StaffListProps {
  staffList: any[];
  onEditStaff?: (staff: any) => void;
  onChangeStaffStatus?: (staffId: number, isActive: boolean) => void;
}

const StaffList: React.FC<StaffListProps> = ({ staffList, onEditStaff, onChangeStaffStatus }) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const pagedData = staffList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <Table
        columns={getColumns()}
        dataSource={pagedData}
        rowKey="id"
        pagination={false}
        bordered
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", margin: "16px 0", padding: 24, borderRadius: 8 }}>
              <Tabs
                defaultActiveKey="1"
                type="line"
                items={[
                  {
                    key: "1",
                    label: "Thông tin nhân viên",
                    children: <StaffInfoTab staff={record} onEditStaff={onEditStaff} onChangeStaffStatus={onChangeStaffStatus} />,
                  },
                  { key: "2", label: "Lịch làm việc", children: <WorkScheduleTab staff={record} /> },
                  { key: "3", label: "Thiết lập lương", children: <SalaryConfigTab staff={record} /> },
                  { key: "4", label: "Phiếu lương", children: <SalarySlipTab staff={record} /> },
                  { key: "5", label: "Nợ và tạm ứng", children: <DebtAdvanceTab /> },
                ]}
              />
            </div>
          ),
          expandedRowKeys,
          onExpand: (expanded, record) => {
            setExpandedRowKeys(expanded ? [record.id] : []);
          },
        }}
        onRow={(record) => ({
          onClick: () => {
            setExpandedRowKeys([record.id]);
          },
        })}
      />
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={staffList.length}
        onChange={setCurrentPage}
        style={{ marginTop: 24, textAlign: "right" }}
      />
    </div>
  );
};

export default StaffList;
