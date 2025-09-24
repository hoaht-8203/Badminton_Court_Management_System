
import React from "react";
import { Button, Tabs } from "antd";
import StaffInfoTab from "./staff-info-tab";
import WorkScheduleTab from "./work-schedule-tab";
import SalaryConfigTab from "./salary-config-tab";
import SalarySlipTab from "./salary-slip-tab";
import DebtAdvanceTab from "./debt-advance-tab";

const StaffDetailBox = ({ staff }: { staff: any }) => {
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e0e0", margin: "16px 0", padding: 16 }}>
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: "Thông tin",
            children: <StaffInfoTab staff={staff} />,
          },
          { key: "2", label: "Lịch làm việc", children: <WorkScheduleTab staff={staff} /> },
          { key: "3", label: "Thiết lập lương", children: <SalaryConfigTab staff={staff} /> },
          { key: "4", label: "Phiếu lương", children: <SalarySlipTab staff={staff} /> },
          { key: "5", label: "Nợ và tạm ứng", children: <DebtAdvanceTab staff={staff} /> },
        ]}
      />
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <Button type="primary">Lấy mã xác nhận</Button>
        <Button type="primary" style={{ background: "#52c41a" }}>
          Cập nhật
        </Button>
        <Button danger>Ngừng làm việc</Button>
      </div>
    </div>
  );
};

export default StaffDetailBox;
