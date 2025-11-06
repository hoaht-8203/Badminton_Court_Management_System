"use client";

import { VoucherResponse } from "@/types-openapi/api";
import { Table, TableProps } from "antd";
import { createVouchersColumns } from "./vouchers-columns";

interface VouchersListProps {
  vouchers: VoucherResponse[];
  loading?: boolean;
  onEdit: (voucher: VoucherResponse) => void;
  onDelete: (id: number) => void;
  onExtend: (voucher: VoucherResponse) => void;
}

const VouchersList = ({ vouchers, loading, onEdit, onDelete, onExtend }: VouchersListProps) => {
  const columns = createVouchersColumns({ onEdit, onDelete, onExtend });

  return (
    <Table
      columns={columns}
      dataSource={vouchers}
      loading={loading}
      rowKey="id"
      scroll={{ x: 1400 }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} voucher`,
      }}
    />
  );
};

export default VouchersList;
