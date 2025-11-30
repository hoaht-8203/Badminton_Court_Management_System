import { PayrollItemResponse } from "@/types-openapi/api";
import { Button, message, Table } from "antd";
import { useMemo, useState } from "react";
import BulkPayDrawer from "./bulk-pay-drawer";
import { ApiError } from "@/lib/axios";

export default function SalarySlipPanel({
  items,
  onPay,
  onBulkPay,
  payrollName,
  payrollStartDate,
  payrollEndDate,
  payrollStatus,
}: {
  items: PayrollItemResponse[];
  onPay?: (payrollItemId: number, amount: number) => void;
  onBulkPay?: (payload: { payrollItemId: number; amount: number }[]) => Promise<void> | void;
  payrollName?: string;
  payrollStartDate?: string | Date;
  payrollEndDate?: string | Date;
  payrollStatus?: string;
}) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  // allow editing amount per item in drawer if desired
  const [amounts, setAmounts] = useState<Record<number, number>>({});

  const dataSource = useMemo(() => items || [], [items]);
  console.log(items);

  const columns = [
    {
      title: "Nhân viên",
      dataIndex: ["staff", "fullName"],
      key: "staff",
      render: (_: any, record: PayrollItemResponse) => record.staff?.fullName ?? `Staff #${record.staffId ?? ""}`,
    },
    { title: "Lương", dataIndex: "netSalary", key: "netSalary", render: (v: number) => v ?? 0 },
    { title: "Đã trả", dataIndex: "paidAmount", key: "paidAmount", render: (v: number) => v ?? 0 },
    {
      title: "Còn nợ",
      key: "unpaid",
      render: (_: any, record: PayrollItemResponse) => (record.netSalary ?? 0) - (record.paidAmount ?? 0),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const openDrawer = () => {
    // init amounts for selected items as unpaid, but only for items that still owe > 0
    const map: Record<number, number> = {};
    selectedRowKeys.forEach((k) => {
      const id = Number(k);
      const rec = dataSource.find((r) => (r.id ?? 0) === id);
      if (!rec) return;
      const unpaid = (rec.netSalary ?? 0) - (rec.paidAmount ?? 0);
      if (unpaid > 0) map[id] = unpaid;
    });
    setAmounts(map);
    setDrawerOpen(true);
  };

  const handleConfirm = async () => {
    if (!onBulkPay) return;
    const payload = Object.entries(amounts).map(([k, v]) => ({ payrollItemId: Number(k), amount: v }));
    try {
      setConfirmLoading(true);
      await onBulkPay(payload);
      setDrawerOpen(false);
      setSelectedRowKeys([]);
      message.success("Thanh toán thành công");
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
    } finally {
      setConfirmLoading(false);
    }
  };

  const validSelectedItems = selectedRowKeys
    .map((k) => dataSource.find((r) => String(r.id ?? "") === String(k))!)
    .filter(Boolean)
    .filter((rec) => (rec.netSalary ?? 0) - (rec.paidAmount ?? 0) > 0) as PayrollItemResponse[];

  return (
    <>
      <Table
        rowKey={(r: PayrollItemResponse) => String(r.id ?? "")}
        rowSelection={rowSelection}
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        size="small"
        bordered
      />
      <div className="mt-2" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button disabled={validSelectedItems.length === 0} type="primary" onClick={openDrawer}>
          Thanh toán ({validSelectedItems.length})
        </Button>
      </div>
      <BulkPayDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedItems={validSelectedItems}
        amounts={amounts}
        setAmounts={(updater) => (typeof updater === "function" ? setAmounts((s) => (updater as any)(s)) : setAmounts(updater))}
        confirmLoading={confirmLoading}
        onConfirm={handleConfirm}
        payrollName={payrollName}
        payrollStartDate={payrollStartDate}
        payrollEndDate={payrollEndDate}
        payrollStatus={payrollStatus}
      />
    </>
  );
}
