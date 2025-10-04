import { PaymentDto } from "@/types-openapi/api";
import { Table, TableProps } from "antd";
import { paymentHistoryColumns } from "./payment-history-columns";

interface PaymentHistoryTableProps {
  data: PaymentDto[];
  loading?: boolean;
}

const PaymentHistoryTable = ({ data, loading = false }: PaymentHistoryTableProps) => {
  const tableProps: TableProps<PaymentDto> = {
    columns: paymentHistoryColumns,
    dataSource: data,
    loading,
    rowKey: "id",
    size: "small",
    scroll: { x: "max-content" },
    pagination: {
      pageSize: 5,
      showSizeChanger: false,
      showQuickJumper: false,
      showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} thanh toán`,
      size: "small",
    },
    bordered: true,
  };

  return (
    <div className="payment-history-table">
      <Table<PaymentDto> {...tableProps} />
    </div>
  );
};

export default PaymentHistoryTable;
