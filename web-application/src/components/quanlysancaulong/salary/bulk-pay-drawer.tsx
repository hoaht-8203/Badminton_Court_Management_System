import type { PayrollItemResponse } from "@/types-openapi/api";
import { Button, Col, DatePicker, Drawer, Input, InputNumber, Row, Table, Typography } from "antd";
import { useMemo, useState } from "react";

export type BulkPayPayload = { payrollItemId: number; amount: number }[];

export default function BulkPayDrawer({
  open,
  onClose,
  selectedItems,
  amounts,
  setAmounts,
  confirmLoading,
  onConfirm,
  payrollName,
  payrollStartDate,
  payrollEndDate,
  payrollStatus,
}: {
  open: boolean;
  onClose: () => void;
  selectedItems: PayrollItemResponse[];
  amounts: Record<number, number>;
  setAmounts: (updater: Record<number, number> | ((s: Record<number, number>) => Record<number, number>)) => void;
  confirmLoading: boolean;
  onConfirm: () => Promise<void> | void;
  payrollName?: string;
  payrollStartDate?: string | Date;
  payrollEndDate?: string | Date;
  payrollStatus?: string;
}) {
  const [note, setNote] = useState<string>("");
  const [searchCode] = useState<string>("");
  const [searchStaff] = useState<string>("");

  const totalUnpaid = useMemo(() => {
    return selectedItems.reduce((s, r) => s + ((r.netSalary ?? 0) - (r.paidAmount ?? 0)), 0);
  }, [selectedItems]);
  const fmtDate = (d?: string | Date) => {
    if (!d) return "";
    try {
      const dt = new Date(d as any);
      return dt.toLocaleDateString("vi-VN");
    } catch {
      return String(d);
    }
  };

  const rows = useMemo(() => {
    const items = selectedItems || [];
    return items.filter((r) => {
      const code = r.id ? `PL${String(r.id).padStart(6, "0")}` : "";
      const staffName = r.staff?.fullName ?? "";
      if (searchCode && !code.toLowerCase().includes(searchCode.toLowerCase())) return false;
      if (searchStaff && !staffName.toLowerCase().includes(searchStaff.toLowerCase())) return false;
      return true;
    });
  }, [selectedItems, searchCode, searchStaff]);

  const columns = [
    {
      title: "Mã phiếu",
      dataIndex: "id",
      key: "code",
      render: (_: any, r: PayrollItemResponse) => (r.id ? `PL${String(r.id).padStart(6, "0")}` : ""),
    },
    {
      title: "Nhân viên",
      dataIndex: ["staff", "fullName"],
      key: "staff",
      render: (_: any, r: PayrollItemResponse) => {
        const staffIdRaw = r.staff?.id ?? r.staffId ?? "";
        const staffIdStr = String(staffIdRaw ?? "");
        const staffIdFormatted = staffIdStr ? (staffIdStr.startsWith("NV") ? staffIdStr : `NV${staffIdStr.replace(/^NV/, "").padStart(6, "0")}`) : "";
        return (
          <div>
            <div>{r.staff?.fullName ?? `Staff #${r.staffId ?? ""}`}</div>
            <div style={{ color: "#666", fontSize: 12 }}>{staffIdFormatted}</div>
          </div>
        );
      },
    },
    { title: "Thành tiền", dataIndex: "netSalary", key: "netSalary", render: (v: number) => v ?? 0 },
    { title: "Đã trả nhân viên", dataIndex: "paidAmount", key: "paidAmount", render: (v: number) => v ?? 0 },
    { title: "Còn cần trả", key: "unpaid", render: (_: any, r: PayrollItemResponse) => (r.netSalary ?? 0) - (r.paidAmount ?? 0) },
    {
      title: "Tiền trả nhân viên",
      key: "pay",
      render: (_: any, r: PayrollItemResponse) => (
        <InputNumber
          min={0}
          value={amounts[r.id ?? 0]}
          onChange={(v) => setAmounts((s: Record<number, number>) => ({ ...s, [r.id ?? 0]: Number(v ?? 0) }))}
        />
      ),
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={1000}
      styles={{ body: { padding: 24 } }}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button onClick={onClose}>Bỏ qua</Button>
          <Button type="primary" loading={confirmLoading} onClick={onConfirm}>
            Tạo phiếu chi
          </Button>
        </div>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={4}>{payrollName ?? "Thanh toán bảng lương"}</Typography.Title>
        <div style={{ color: "#666" }}>
          Kỳ làm việc: {fmtDate(payrollStartDate)} - {fmtDate(payrollEndDate)}
          {payrollStatus ? ` | Trạng thái: ${payrollStatus}` : ""}
        </div>
      </div>

      <Row gutter={24} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>Tiền trả nhân viên</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{new Intl.NumberFormat("vi-VN").format(totalUnpaid)}</div>
          <div style={{ marginTop: 12 }}>
            {/* <Select value={method} onChange={(v) => setMethod(v)} style={{ width: 220 }}>
              <Select.Option value="cash">Tiền mặt</Select.Option>
              <Select.Option value="bank">Chuyển khoản</Select.Option>
            </Select> */}
          </div>
        </Col>
        <Col span={12}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <DatePicker showTime />
            <Input placeholder="Ghi chú" style={{ width: 240 }} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </Col>
      </Row>

      {/* <div style={{ marginBottom: 12, background: '#f5f7fa', padding: 12, borderRadius: 4 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input placeholder="Tìm mã phiếu" value={searchCode} onChange={(e) => setSearchCode(e.target.value)} style={{ width: 200 }} />
          <Input placeholder="Tìm tên, mã nhân viên" value={searchStaff} onChange={(e) => setSearchStaff(e.target.value)} style={{ width: 300 }} />
        </div>
      </div> */}

      <Table dataSource={rows} columns={columns} rowKey={(r) => String(r.id ?? "")} pagination={false} />
    </Drawer>
  );
}
