"use client";

import VouchersList from "@/components/quanlysancaulong/vouchers/vouchers-list";
import CreateVoucherDrawer from "@/components/quanlysancaulong/vouchers/create-voucher-drawer";
import UpdateVoucherDrawer from "@/components/quanlysancaulong/vouchers/update-voucher-drawer";
import ExtendVoucherDrawer from "@/components/quanlysancaulong/vouchers/extend-voucher-drawer";
import SearchVoucher from "@/components/quanlysancaulong/vouchers/search-voucher";
import { useListVouchers, useDeleteVoucher } from "@/hooks/useVouchers";
import { ApiError } from "@/lib/axios";
import { VoucherResponse } from "@/types-openapi/api";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Modal, message } from "antd";
import { useState } from "react";

const VouchersPage = () => {
  const [openCreate, setOpenCreate] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null);
  const [openExtend, setOpenExtend] = useState(false);
  const [extendVoucherId, setExtendVoucherId] = useState<number | null>(null);

  const { data: vouchersResp, isFetching, refetch } = useListVouchers();
  const [filters, setFilters] = useState<Partial<VoucherResponse> & { startAtFrom?: Date | null; startAtTo?: Date | null }>({});
  const deleteMutation = useDeleteVoucher();
  const [modal, contextHolder] = Modal.useModal();

  const handleEdit = (voucher: VoucherResponse) => {
    setSelectedVoucherId(voucher.id ?? null);
    setOpenUpdate(true);
  };

  const handleExtend = (voucher: VoucherResponse) => {
    setExtendVoucherId(voucher.id ?? null);
    setOpenExtend(true);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "Xóa voucher",
      content: "Bạn có chắc chắn muốn xóa voucher này?",
      onOk: () => {
        deleteMutation.mutate(
          { id },
          {
            onSuccess: () => {
              message.success("Xóa voucher thành công!");
            },
            onError: (err: ApiError) => {
              message.error(err.message);
            },
          },
        );
      },
      okText: "Xóa",
      cancelText: "Hủy",
    });
  };

  const vouchers = vouchersResp?.data ?? [];

  const filtered = vouchers.filter((v) => {
    // code filter
    if (filters.code && !(v.code ?? "").toLowerCase().includes((filters.code as string).toLowerCase())) return false;
    // title filter
    if (filters.title && !((v.title ?? "") + " " + (v.description ?? "")).toLowerCase().includes((filters.title as string).toLowerCase()))
      return false;
    // discountType filter
    if (filters.discountType && !(v.discountType ?? "").toLowerCase().includes((filters.discountType as string).toLowerCase())) return false;
    // isActive filter
    if (typeof filters.isActive === "boolean" && v.isActive !== filters.isActive) return false;
    // startAt range filter
    if (filters.startAtFrom && v.startAt && new Date(v.startAt) < new Date(filters.startAtFrom)) return false;
    if (filters.startAtTo && v.startAt && new Date(v.startAt) > new Date(filters.startAtTo)) return false;
    return true;
  });

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb items={[{ title: "Quản trị ứng dụng" }, { title: "Quản lý voucher" }]} />
      </div>

      <SearchVoucher onSearch={(s) => setFilters(s)} onReset={() => setFilters({})} />

      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="font-bold text-green-500">
            Tổng số voucher: {filtered.length} / {vouchersResp?.data?.length ?? 0}
          </span>
        </div>
        <div className="flex gap-2">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreate(true)}>
            Thêm voucher
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Tải lại
          </Button>
        </div>
      </div>

      <VouchersList vouchers={filtered} loading={isFetching} onEdit={handleEdit} onDelete={handleDelete} onExtend={handleExtend} />

      <CreateVoucherDrawer open={openCreate} onClose={() => setOpenCreate(false)} />

      <UpdateVoucherDrawer open={openUpdate} onClose={() => setOpenUpdate(false)} voucherId={selectedVoucherId} />

      <ExtendVoucherDrawer open={openExtend} onClose={() => setOpenExtend(false)} voucherId={extendVoucherId} />

      {contextHolder}
    </section>
  );
};

export default VouchersPage;
