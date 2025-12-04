"use client";
import { useGetPayrollById, usePayPayrollItem, useRefreshPayroll } from "@/hooks/usePayroll";
import { PayrollItemResponse } from "@/types-openapi/api";
import { Spin, Tabs, message } from "antd";
import SalaryHistoryPanel from "./salary-history-panel";
import SalaryInfoPanel from "./salary-info-panel";
import SalarySlipPanel from "./salary-slip-panel";
import { ApiError } from "@/lib/axios";

export default function SalaryTabs({ payrollId }: { payrollId: number }) {
  // unwrapped payroll detail or null
  const { data: payrollDetail, isFetching } = useGetPayrollById(payrollId);

  // mutations must be declared unconditionally to keep hooks order stable
  const refreshMutation = useRefreshPayroll();
  const payMutation = usePayPayrollItem();

  const handleRefresh = () => {
    if (payrollId) {
      refreshMutation.mutate(payrollId, {
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
    }
  };

  const handlePayItem = (payrollItemId: number, amount: number) => {
    payMutation.mutate(
      { payrollItemId, amount },
      {
        onSuccess: () => {
          message.success("Thanh toán thành công");
          // after paying an item, refresh payroll detail
          if (payrollId) refreshMutation.mutate(payrollId);
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
            message.error("Có lỗi khi thanh toán");
          }
        },
      },
    );
  };

  const handleBulkPay = async (payload: { payrollItemId: number; amount: number }[]) => {
    try {
      await Promise.all(payload.map((p) => payMutation.mutateAsync(p)));
      if (payrollId) refreshMutation.mutate(payrollId);
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError?.errors) {
        for (const key in apiError.errors) {
          message.error(apiError.errors[key]);
        }
      } else if (apiError?.message) {
        message.error(apiError.message);
      } else {
        message.error("Có lỗi xảy ra khi thanh toán");
      }
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
          children: <SalaryHistoryPanel history={payrollDetail?.cashflows ?? []} />,
        },
      ]}
    />
  );
}
