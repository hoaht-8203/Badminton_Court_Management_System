import { Table } from "antd";
import type { CashflowResponse } from "@/types-openapi/api";
import dayjs from "dayjs";

export default function SalaryHistoryPanel({ history }: { history: CashflowResponse[] | undefined | null }) {
  const columns = [
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      render: (t: string) => (t ? dayjs(t).format("DD/MM/YYYY HH:mm") : ""),
    },
    { title: "Mã tham chiếu", dataIndex: "referenceNumber", key: "referenceNumber" },
    // { title: "Loại/ID liên quan", dataIndex: "cashflowTypeName", key: "cashflowTypeName", render: (_: any, r: CashflowResponse) => `${r.cashflowTypeName ?? r.cashflowTypeId ?? ""} / ${r.relatedId ?? ""}` },
    {
      title: "Người nhận",
      dataIndex: "relatedPerson",
      key: "relatedPerson",
      render: (_: any, r: CashflowResponse) => `${r.relatedPerson ? ` - ${r.relatedPerson}` : ""}`,
    },
    { title: "Số tiền", dataIndex: "value", key: "value", render: (v: number) => new Intl.NumberFormat("vi-VN").format(v ?? 0) },
    { title: "Trạng thái", dataIndex: "status", key: "status" },
    { title: "Ghi chú", dataIndex: "note", key: "note" },
    { title: "Người tạo", dataIndex: "createdBy", key: "createdBy" },
  ];

  return <Table<CashflowResponse> dataSource={history ?? []} columns={columns} rowKey={(r) => String(r.id ?? Math.random())} pagination={false} />;
}
