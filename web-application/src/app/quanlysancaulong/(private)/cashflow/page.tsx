"use client";

import CashflowFilter from "@/components/quanlysancaulong/cashflow/cashflow-filter";
import CashflowList from "@/components/quanlysancaulong/cashflow/cashflow-list";
import { useListCashflow } from "@/hooks/useCashflow";
import { ListCashflowRequest } from "@/types-openapi/api";
import { Breadcrumb, Button, Modal, message } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useState } from "react";

const CashflowPage = () => {
  const [searchParams, setSearchParams] = useState<ListCashflowRequest>({
    isPayment: undefined,
    from: undefined,
    to: undefined,
    cashflowTypeId: undefined,
    status: undefined,
  });

  const [modal, contextHolder] = Modal.useModal();

  const { data: cashflowData, isFetching: loadingCashflowData, refetch: refetchCashflow } = useListCashflow(searchParams);

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb
          items={[
            {
              title: "Quản lý sàn cầu lông",
            },
            {
              title: "Sổ quỹ tiền mặt",
            },
          ]}
        />
      </div>

      <div className="mb-2">
        <CashflowFilter
          onSearch={setSearchParams}
          onReset={() => setSearchParams({ isPayment: undefined, from: undefined, to: undefined, cashflowTypeId: undefined, status: undefined })}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số phiếu: {cashflowData?.data?.length ?? 0}</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info("Tạo phiếu (chưa triển khai)")}>
              Lập phiếu thu
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetchCashflow()}>
              Tải lại
            </Button>
          </div>
        </div>

        <CashflowList
          data={cashflowData?.data ?? []}
          loading={loadingCashflowData}
          onRefresh={() => refetchCashflow()}
          modal={modal}
          contextHolder={contextHolder}
        />
      </div>
    </section>
  );
};

export default CashflowPage;
