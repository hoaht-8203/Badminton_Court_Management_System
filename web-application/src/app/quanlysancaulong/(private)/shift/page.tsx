"use client";
import { useListShifts, useCreateShift, useUpdateShift, useDeleteShift } from "@/hooks/useShift";
import { useShiftModal } from "@/components/quanlysancaulong/staffs/shift/shift-modal";
import ShiftTable from "@/components/quanlysancaulong/staffs/shift/shift-table";
import { Breadcrumb, message, Modal } from "antd";
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
    Modal.confirm({
      title: "Xác nhận xóa ca làm việc",
      content: `Bạn có chắc chắn muốn xóa ca "${record.name}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => {
        setModalLoading(true);
        deleteMutation.mutate(record.id, {
          onSuccess: (res: any) => {
            setModalLoading(false);
            refetch?.();
            message.success(res?.message || "Xóa thành công");
          },
          onError: (err: any) => {
            setModalLoading(false);
            message.error(err?.message || "Xóa thất bại");
          },
        });
      },
    });
  };
  const handleModalOk = (values: any) => {
    setModalLoading(true);
    if (editRecord && editRecord.id) {
      updateMutation.mutate(
        { ...values, id: editRecord.id },
        {
          onSuccess: (res: any) => {
            setModalLoading(false);
            refetch?.();
            hide();
            message.success(res?.message || "Cập nhật thành công");
          },
          onError: (err: any) => {
            setModalLoading(false);
            message.error(err?.message || "Cập nhật thất bại");
          },
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: (res: any) => {
          setModalLoading(false);
          refetch?.();
          hide();
          message.success(res?.message || "Thêm mới thành công");
        },
        onError: (err: any) => {
          setModalLoading(false);
          message.error(err?.message || "Thêm mới thất bại");
        },
      });
    }
  };
  const handleChangeStatus = (record: any) => {
    setModalLoading(true);
    updateMutation.mutate(
      { ...record, isActive: !record.isActive, id: record.id },
      {
        onSuccess: (res: any) => {
          setModalLoading(false);
          refetch?.();
          message.success(res?.message || "Cập nhật trạng thái thành công");
        },
        onError: (err: any) => {
          setModalLoading(false);
          message.error(err?.message || "Cập nhật trạng thái thất bại");
        },
      },
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[{ title: "Quản lý sân cầu lông" }, { title: "Ca làm việc" }]} />
      </div>
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
