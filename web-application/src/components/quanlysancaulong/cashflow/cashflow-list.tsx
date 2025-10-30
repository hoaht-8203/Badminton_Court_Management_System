"use client";

import type { CashflowResponse } from "@/types-openapi/api";
import { Table, TableProps } from "antd";
import dayjs from "dayjs";
import CashflowExpanded from "./cashflow-expanded";

const tableProps: TableProps<CashflowResponse> = {
  rowKey: (r) => r.referenceNumber ?? r.id?.toString() ?? Math.random().toString(),
  //   size: "small",
  scroll: { x: "max-content" },
  expandable: { expandRowByClick: true },
  bordered: true,
};

export default function CashflowList({
  data,
  loading,
  contextHolder,
  onOpenDrawer,
}: {
  data: CashflowResponse[];
  loading: boolean;
  onRefresh: () => void;
  modal?: any;
  contextHolder?: any;
  onOpenDrawer?: (record: CashflowResponse) => void;
}) {
  const columns = [
    {
      title: "Mã phiếu",
      dataIndex: "referenceNumber",
      key: "referenceNumber",
      render: (v: any, record: CashflowResponse) => v ?? record.id ?? "",
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      render: (v: any) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : ""),
    },
    {
      title: "Thu / Chi",
      dataIndex: "isPayment",
      key: "isPayment",
      render: (v: any) => (v === true ? "Chi" : v === false ? "Thu" : ""),
    },
    {
      title: "Loại thu chi",
      dataIndex: "cashflowTypeName",
      key: "cashflowTypeName",
      render: (v: any) => v ?? "",
    },
    {
      title: "Giá trị",
      dataIndex: "value",
      key: "value",
      render: (v: any) => v?.toLocaleString?.() ?? v,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
    },
  ];

  return (
    <div>
      {contextHolder}
      <Table<CashflowResponse>
        {...tableProps}
        columns={columns}
        dataSource={data}
        loading={loading}
        expandable={{
          expandRowByClick: true,
          expandedRowRender: (record: CashflowResponse) => <CashflowExpanded record={record} onOpen={(r) => onOpenDrawer?.(r)} onPrint={() => {}} />,
        }}
      />
    </div>
  );
}
