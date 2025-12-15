"use client";

import type { CashflowResponse } from "@/types-openapi/api";
import { ConfigProvider, Table, TableProps } from "antd";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import CashflowExpanded from "./cashflow-expanded";

const tableProps: TableProps<CashflowResponse> = {
  rowKey: (r) => r.id?.toString() ?? Math.random().toString(),
  //   size: "small",
  scroll: { x: "max-content" },
  expandable: { expandRowByClick: true },
  bordered: true,
};

export default function CashflowList({
  data,
  loading,
  onRefresh,
  modal,
  contextHolder,
  onOpenDrawer,
  onChangeStatus,
}: {
  data: CashflowResponse[];
  loading: boolean;
  onRefresh: () => void;
  modal?: any;
  contextHolder?: any;
  onOpenDrawer?: (record: CashflowResponse) => void;
  onChangeStatus?: (id: number, newStatus: string) => void;
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
      sorter: (a: CashflowResponse, b: CashflowResponse) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return new Date(a.time).getTime() - new Date(b.time).getTime();
      },
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
      title: "Người trả/nhận",
      dataIndex: "relatedPerson",
      key: "relatedPerson",
      render: (v: any) => v ?? "-",
    },
    {
      title: "Giá trị",
      dataIndex: "value",
      key: "value",
      sorter: (a: CashflowResponse, b: CashflowResponse) => {
        const valA = a.value ?? 0;
        const valB = b.value ?? 0;
        return valA - valB;
      },
      render: (v: any, record: CashflowResponse) => {
        const displayValue = record.isPayment ? -(v ?? 0) : (v ?? 0);
        return displayValue?.toLocaleString?.() ?? displayValue;
      },
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
      <ConfigProvider locale={viVN}>
        <Table<CashflowResponse>
          {...tableProps}
          columns={columns}
          dataSource={data}
          loading={loading}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record: CashflowResponse) => (
              <CashflowExpanded record={record} onOpen={(r) => onOpenDrawer?.(r)} onChangeStatus={onChangeStatus} />
            ),
          }}
        />
      </ConfigProvider>
    </div>
  );
}
