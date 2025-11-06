"use client";

import VouchersList from "@/components/quanlysancaulong/vouchers/vouchers-list";
import CreateVoucherDrawer from "@/components/quanlysancaulong/vouchers/create-voucher-drawer";
import UpdateVoucherDrawer from "@/components/quanlysancaulong/vouchers/update-voucher-drawer";
import ExtendVoucherDrawer from "@/components/quanlysancaulong/vouchers/extend-voucher-drawer";
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
        deleteMutation.mutate({ id }, {
          onSuccess: () => {
            message.success("Xóa voucher thành công!");
          },
          onError: (err: ApiError) => {
            message.error(err.message);
          },
        });
      },
      okText: "Xóa",
      cancelText: "Hủy",
    });
  };

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb
          items={[
            { title: "Quản trị ứng dụng" },
            { title: "Quản lý voucher" },
          ]}
        />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="font-bold text-green-500">Tổng số voucher: {vouchersResp?.data?.length ?? 0}</span>
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

  <VouchersList vouchers={vouchersResp?.data ?? []} loading={isFetching} onEdit={handleEdit} onDelete={handleDelete} onExtend={handleExtend} />

      <CreateVoucherDrawer open={openCreate} onClose={() => setOpenCreate(false)} />

  <UpdateVoucherDrawer open={openUpdate} onClose={() => setOpenUpdate(false)} voucherId={selectedVoucherId} />

  <ExtendVoucherDrawer open={openExtend} onClose={() => setOpenExtend(false)} voucherId={extendVoucherId} />

      {contextHolder}
    </section>
  );
};

export default VouchersPage;
