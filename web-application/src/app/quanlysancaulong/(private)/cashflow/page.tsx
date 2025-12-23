"use client";

import dynamic from "next/dynamic";
import React, { useState, useMemo, useCallback, Suspense } from "react";
import { useListCashflow, useCreateCashflow, useUpdateCashflowFn } from "@/hooks/useCashflow";
import { ListCashflowRequest } from "@/types-openapi/api";
import { Breadcrumb, Button, Modal, message, Spin } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";

const CashflowFilter = dynamic(() => import("@/components/quanlysancaulong/cashflow/cashflow-filter"), {
  ssr: false,
  loading: () => <Spin />,
});
const CashflowList = dynamic(() => import("@/components/quanlysancaulong/cashflow/cashflow-list"), {
  ssr: false,
  loading: () => <Spin />,
});
const CashflowDrawer = dynamic(() => import("@/components/quanlysancaulong/cashflow/cashflow-drawer"), {
  ssr: false,
  loading: () => <Spin />,
});

const CashflowPage: React.FC = () => {
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
  // Fetch all cashflow data for summary calculation (without filters)
  const { data: allCashflowData } = useListCashflow({
    isPayment: undefined,
    from: undefined,
    to: undefined,
    cashflowTypeId: undefined,
    status: undefined,
  });

  // compute summary numbers from ALL data (not filtered)
  const allItems = useMemo(() => allCashflowData?.data ?? [], [allCashflowData]);
  const totalThu = useMemo(() => allItems.filter((i) => !i.isPayment).reduce((s, it) => s + (it.value ?? 0), 0), [allItems]);
  const totalChi = useMemo(() => allItems.filter((i) => i.isPayment).reduce((s, it) => s - (it.value ?? 0), 0), [allItems]);
  const balance = useMemo(() => totalThu + totalChi, [totalThu, totalChi]);

  // items for display in list (filtered)
  const items = useMemo(() => cashflowData?.data ?? [], [cashflowData]);

  const handleOpenCreate = useCallback(() => {
    setDrawerMode("create");
    setEditing(null);
    setDrawerOpen(true);
  }, []);

  const handleOpenEdit = useCallback((record: any) => {
    setEditing(record);
    setDrawerMode("update");
    setDrawerOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (payload: any) => {
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
    },
    [drawerMode, createMutation, updateFn, editing, refetchCashflow],
  );

  const handleChangeStatus = useCallback(
    async (id: number, newStatus: string) => {
      try {
        // Fetch current cashflow data
        const currentData = items.find((item) => item.id === id);
        if (!currentData) return;

        await updateFn(id, {
          cashflowTypeId: currentData.cashflowTypeId!,
          value: currentData.value!,
          isPayment: currentData.isPayment!,
          status: newStatus,
          time: currentData.time ? new Date(currentData.time) : undefined,
          personType: currentData.personType,
          relatedPerson: currentData.relatedPerson,
          note: currentData.note,
        });
        message.success("Cập nhật trạng thái thành công");
        refetchCashflow();
      } catch (error) {
        message.error("Cập nhật trạng thái thất bại");
      }
    },
    [items, updateFn, refetchCashflow],
  );

  const totalCount = items.length;

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
          <Suspense fallback={<Spin />}>
            <CashflowFilter
              onSearch={setSearchParams}
              onReset={() => setSearchParams({ isPayment: undefined, from: undefined, to: undefined, cashflowTypeId: undefined, status: undefined })}
            />
          </Suspense>
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
            <span className="font-bold text-green-500">Tổng số phiếu: {totalCount}</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              Lập phiếu mới
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => refetchCashflow()}>
              Tải lại
            </Button>
          </div>
        </div>

        <Suspense fallback={<Spin />}>
          <CashflowList
            data={items}
            loading={loadingCashflowData}
            onRefresh={() => refetchCashflow()}
            modal={modal}
            contextHolder={contextHolder}
            // allow list/expanded to open drawer for edit
            onOpenDrawer={handleOpenEdit}
            onChangeStatus={handleChangeStatus}
          />
        </Suspense>

        <Suspense fallback={<Spin />}>
          <CashflowDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            mode={drawerMode}
            initialValues={editing}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </Suspense>
      </div>
    </section>
  );
};

export default React.memo(CashflowPage);
