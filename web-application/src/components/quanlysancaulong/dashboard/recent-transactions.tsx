"use client";

import React from "react";
import { Card, Table } from "antd";

interface Transaction {
  id: string;
  date: string;
  desc: string;
  amount: number;
}

interface Props {
  data?: Transaction[];
}

const RecentTransactions: React.FC<Props> = ({ data = [] }) => {
  const columns = [
    { title: "Mã", dataIndex: "id", key: "id" },
    { title: "Ngày", dataIndex: "date", key: "date" },
    { title: "Mô tả", dataIndex: "desc", key: "desc" },
    { title: "Số tiền", dataIndex: "amount", key: "amount", render: (v: number) => v.toLocaleString() },
  ];

  return (
    <Card title="Giao dịch gần đây">
      <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />
    </Card>
  );
};

export default React.memo(RecentTransactions);
