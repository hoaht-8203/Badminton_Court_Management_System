"use client";

import CashflowFilter from "@/components/quanlysancaulong/cashflow/cashflow-filter";
import CashflowList from "@/components/quanlysancaulong/cashflow/cashflow-list";
import CashflowDrawer from "@/components/quanlysancaulong/cashflow/cashflow-drawer";
import { useListCashflow, useCreateCashflow, useUpdateCashflowFn } from "@/hooks/useCashflow";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "update">("create");
  const [editing, setEditing] = useState<null | any>(null);

  const createMutation = useCreateCashflow();
  const updateFn = useUpdateCashflowFn();
  // we'll call useUpdateCashflow when needed with the right id in the submit handler
  const [submitting, setSubmitting] = useState(false);

  const { data: cashflowData, isFetching: loadingCashflowData, refetch: refetchCashflow } = useListCashflow(searchParams);

  // compute summary numbers
  const items = cashflowData?.data ?? [];
  const totalThu = items.filter((i) => !i.isPayment).reduce((s, it) => s + (it.value ?? 0), 0);
  const totalChi = items.filter((i) => i.isPayment).reduce((s, it) => s + (it.value ?? 0), 0);
  // represent totalChi as negative (payments are negative amounts)
  // calculate balance by adding (receipts + negative payments)
  const balance = totalThu + totalChi;

  return (
    <section>
      <div className="mb-2">
        <div className="mb-2">
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
      </div>
      <div className="mb-2 flex items-center justify-between">
        <div className="mb-4 w-full rounded bg-white p-4 shadow-sm">
          <div className="flex items-center justify-end gap-8">
            <div className="text-center">
              <div className="text-sm text-slate-600">Tổng thu</div>
              <div className="text-lg font-semibold text-blue-600">{totalThu.toLocaleString()}</div>
            </div>

            <div className="text-center">
              <div className="text-sm text-slate-600">Tổng chi</div>
              <div className="text-lg font-semibold text-red-600">{totalChi.toLocaleString()}</div>
            </div>

            <div className="text-center">
              <div className="text-sm text-slate-600">Tồn quỹ</div>
              <div className={`text-lg font-semibold ${balance < 0 ? "text-red-600" : "text-green-600"}`}>{balance.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số phiếu: {cashflowData?.data?.length ?? 0}</span>
          </div>
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setDrawerMode("create");
                setEditing(null);
                setDrawerOpen(true);
              }}
            >
              Lập phiếu mới
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => refetchCashflow()}>
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
          // allow list/expanded to open drawer for edit
          onOpenDrawer={(record: any) => {
            setEditing(record);
            setDrawerMode("update");
            setDrawerOpen(true);
          }}
        />

        <CashflowDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          mode={drawerMode}
          initialValues={editing}
          submitting={submitting}
          onSubmit={async (payload: any) => {
            try {
              setSubmitting(true);
              if (drawerMode === "create") {
                await createMutation.mutateAsync(payload);
                message.success("Tạo phiếu thành công");
              } else if (drawerMode === "update" && editing?.id) {
                await updateFn(editing.id, payload);
                message.success("Cập nhật phiếu thành công");
              }
              setDrawerOpen(false);
              refetchCashflow();
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </div>
    </section>
  );
};

export default CashflowPage;
