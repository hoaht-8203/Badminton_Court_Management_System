"use client";
import React, { useEffect, useState } from "react";
import { Tabs, Spin } from "antd";
import SalaryInfoPanel from "./salary-info-panel";
import SalarySlipPanel from "./salary-slip-panel";
import SalaryHistoryPanel from "./salary-history-panel";
import { useGetPayrollById, useRefreshPayroll, usePayPayrollItem } from "@/hooks/usePayroll";
import { PayrollDetailResponse, PayrollItemResponse } from "@/types-openapi/api";

export default function SalaryTabs({ payrollId }: { payrollId: number }) {
  // unwrapped payroll detail or null
  const { data: payrollDetail, isFetching } = useGetPayrollById(payrollId);

  // mutations must be declared unconditionally to keep hooks order stable
  const refreshMutation = useRefreshPayroll();
  const payMutation = usePayPayrollItem();

  const handleRefresh = () => {
    if (payrollId) refreshMutation.mutate(payrollId);
  };

  const handlePayItem = (payrollItemId: number, amount: number) => {
    payMutation.mutate(
      { payrollItemId, amount },
      {
        onSuccess: () => {
          // after paying an item, refresh payroll detail
          if (payrollId) refreshMutation.mutate(payrollId);
        },
      },
    );
  };

  const handleBulkPay = async (payload: { payrollItemId: number; amount: number }[]) => {
    try {
      await Promise.all(payload.map((p) => payMutation.mutateAsync(p)));
      if (payrollId) refreshMutation.mutate(payrollId);
    } catch (err) {
      console.error("Bulk pay error", err);
      throw err;
    }
  };

  if (isFetching && !payrollDetail) {
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  const code = payrollDetail?.id ? `BL${String(payrollDetail?.id).padStart(6, "0")}` : payrollId ? `BL${String(payrollId).padStart(6, "0")}` : "";
  const payrollItems: PayrollItemResponse[] = payrollDetail?.payrollItems ?? [];
  console.log(payrollDetail);

  return (
    <Tabs
      defaultActiveKey="info"
      items={[
        {
          key: "info",
          label: "Thông tin",
          children: (
            <SalaryInfoPanel
              payroll={payrollDetail ?? undefined}
              code={code}
              onRefresh={handleRefresh}
              refreshing={refreshMutation.status === "pending"}
            />
          ),
        },
        {
          key: "slip",
          label: "Phiếu lương",
          children: (
            <SalarySlipPanel
              items={payrollItems}
              onPay={handlePayItem}
              onBulkPay={handleBulkPay}
              payrollName={payrollDetail?.name ?? undefined}
              payrollStartDate={payrollDetail?.startDate ?? undefined}
              payrollEndDate={payrollDetail?.endDate ?? undefined}
              payrollStatus={payrollDetail?.status ?? undefined}
            />
          ),
        },
        {
          key: "history",
          label: "Lịch sử thanh toán",
          children: <SalaryHistoryPanel history={[]} />,
        },
      ]}
    />
  );
}
