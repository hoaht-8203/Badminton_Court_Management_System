"use client";
import { useListShifts, useCreateShift, useUpdateShift, useDeleteShift } from "@/hooks/useShift";
import { useShiftModal } from "@/components/quanlysancaulong/staffs/shift/shift-modal";
import ShiftTable from "@/components/quanlysancaulong/staffs/shift/shift-table";
import React from "react";

export default function ShiftPage() {
  const { data: shiftData, isFetching, refetch } = useListShifts();
  const { show, hide, ModalComponent } = useShiftModal();
  const [modalLoading, setModalLoading] = React.useState(false);
  const createMutation = useCreateShift();
  const updateMutation = useUpdateShift(); // Giữ nguyên như cũ
  const deleteMutation = useDeleteShift();
  const [editRecord, setEditRecord] = React.useState<any | null>(null);

  const handleAdd = () => {
    setEditRecord(null);
    show();
  };
  const handleEdit = (record: any) => {
    setEditRecord(record);
    show(record);
  };
  const handleDelete = (record: any) => {
    setModalLoading(true);
    deleteMutation.mutate(record.id, {
      onSuccess: () => {
        setModalLoading(false);
        refetch?.();
      },
      onError: () => setModalLoading(false),
    });
  };
  const handleModalOk = (values: any) => {
    setModalLoading(true);
    if (editRecord && editRecord.id) {
      updateMutation.mutate(
        { ...values, id: editRecord.id },
        {
          onSuccess: () => {
            setModalLoading(false);
            refetch?.();
            hide(); // Đóng modal sau khi cập nhật thành công
          },
          onError: () => setModalLoading(false),
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          setModalLoading(false);
          refetch?.();
          hide(); // Đóng modal sau khi tạo thành công
        },
        onError: () => setModalLoading(false),
      });
    }
  };
  const handleChangeStatus = (record: any) => {
    setModalLoading(true);
    updateMutation.mutate(
      { ...record, isActive: !record.isActive, id: record.id },
      {
        onSuccess: () => {
          setModalLoading(false);
          refetch?.();
        },
        onError: () => setModalLoading(false),
      },
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <ShiftTable
        shiftData={shiftData ?? []}
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
}
