"use client";
import { Tabs } from "antd";
import SalaryInfoPanel from "./salary-info-panel";
import SalarySlipPanel from "./salary-slip-panel";
import SalaryHistoryPanel from "./salary-history-panel";

export default function SalaryTabs({ salary }: { salary: any }) {
  return (
    <Tabs
      defaultActiveKey="info"
      items={[
        {
          key: "info",
          label: "Thông tin",
          children: <SalaryInfoPanel salary={salary} />,
        },
        {
          key: "slip",
          label: "Phiếu lương",
          children: <SalarySlipPanel slips={salary.slips || []} />,
        },
        {
          key: "history",
          label: "Lịch sử thanh toán",
          children: <SalaryHistoryPanel history={salary.history || []} />,
        },
      ]}
    />
  );
}
