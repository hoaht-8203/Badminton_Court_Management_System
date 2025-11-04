"use client";
import dynamic from "next/dynamic";
import { useListShifts, useCreateShift, useUpdateShift, useDeleteShift } from "@/hooks/useShift";
import { useShiftModal } from "@/components/quanlysancaulong/staffs/shift/shift-modal";
import React, { useCallback, useMemo } from "react";
import { Breadcrumb, message, Modal, Spin } from "antd";
import { ShiftRequest, ShiftResponse } from "@/types-openapi/api";

// Lazy-load the table to reduce initial bundle size and defer rendering until needed
const ShiftTable = dynamic(() => import("@/components/quanlysancaulong/staffs/shift/shift-table"), {
  ssr: false,
  loading: () => <Spin />,
});

export default React.memo(function ShiftPage() {
  const { data: shiftData, isFetching, refetch } = useListShifts(true);
  const { show, hide, ModalComponent } = useShiftModal();
  const [modalLoading, setModalLoading] = React.useState(false);
  const createMutation = useCreateShift();
  const updateMutation = useUpdateShift();
  const deleteMutation = useDeleteShift();
  const [editRecord, setEditRecord] = React.useState<ShiftResponse | null>(null);

  // Memoize derived data to avoid creating new arrays each render
  const shiftList = useMemo(() => shiftData ?? [], [shiftData]);

  const handleAdd = useCallback(() => {
    setEditRecord(null);
    show();
  }, [show]);

  const handleEdit = useCallback((record: ShiftResponse) => {
    setEditRecord(record);
    show(record);
  }, [show]);

  const handleDelete = useCallback(
    (record: ShiftResponse) => {
      Modal.confirm({
        title: "Xác nhận xóa ca làm việc",
        content: `Bạn có chắc chắn muốn xóa ca "${record.name}"?`,
        okText: "Xóa",
        okType: "danger",
        cancelText: "Hủy",
        onOk: () => {
          setModalLoading(true);
          deleteMutation.mutate(record.id!, {
            onSuccess: (res: { message?: string }) => {
              setModalLoading(false);
              refetch?.();
              message.success(res?.message || "Xóa thành công");
            },
            onError: (err: { message?: string }) => {
              setModalLoading(false);
              message.error(err?.message || "Xóa thất bại");
            },
          });
        },
      });
    },
    [deleteMutation, refetch],
  );

  const handleModalOk = useCallback(
    (values: ShiftRequest) => {
      setModalLoading(true);
      if (editRecord && editRecord.id) {
        updateMutation.mutate(
          { ...values, id: editRecord.id },
          {
            onSuccess: (res: { message?: string }) => {
              setModalLoading(false);
              refetch?.();
              hide();
              message.success(res?.message || "Cập nhật thành công");
            },
            onError: (err: { message?: string }) => {
              setModalLoading(false);
              message.error(err?.message || "Cập nhật thất bại");
            },
          },
        );
      } else {
        createMutation.mutate(values, {
          onSuccess: (res: { message?: string }) => {
            setModalLoading(false);
            refetch?.();
            hide();
            message.success(res?.message || "Thêm mới thành công");
          },
          onError: (err: { message?: string }) => {
            setModalLoading(false);
            message.error(err?.message || "Thêm mới thất bại");
          },
        });
      }
    },
    [createMutation, updateMutation, editRecord, refetch, hide],
  );

  const handleChangeStatus = useCallback(
    (record: ShiftResponse) => {
      setModalLoading(true);
      updateMutation.mutate(
        { ...record, isActive: !record.isActive, id: record.id! },
        {
          onSuccess: (res: { message?: string }) => {
            setModalLoading(false);
            refetch?.();
            message.success(res?.message || "Cập nhật trạng thái thành công");
          },
          onError: (err: { message?: string }) => {
            setModalLoading(false);
            message.error(err?.message || "Cập nhật trạng thái thất bại");
          },
        },
      );
    },
    [updateMutation, refetch],
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[{ title: "Quản lý sân cầu lông" }, { title: "Ca làm việc" }]} />
      </div>
      <ShiftTable
        shiftData={shiftList}
        isFetching={isFetching}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onModalOk={handleModalOk}
        onChangeStatus={handleChangeStatus}
        modalLoading={modalLoading}
      />
      <ModalComponent onOk={handleModalOk} loading={modalLoading} />
    </div>
  );
});
