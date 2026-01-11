"use client";

import React, { useMemo } from "react";
import { Card, Empty, Spin, Table, Tag, Typography, Statistic, Row, Col } from "antd";
import { DollarOutlined, CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useGetMyPayrollItems } from "@/hooks/usePayroll";
import { PayrollItemResponse } from "@/types-openapi/api";

const { Text } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  Pending: { color: "orange", text: "Chờ thanh toán" },
  Completed: { color: "green", text: "Đã thanh toán" },
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const SalaryTab: React.FC = () => {
  const { data: payrollItems = [], isLoading } = useGetMyPayrollItems();

  // Calculate summary statistics
  const { totalNetSalary, totalPaidAmount, pendingAmount } = useMemo(() => {
    const totalNet = payrollItems.reduce((sum, item) => sum + (item.netSalary || 0), 0);
    const totalPaid = payrollItems.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    return {
      totalNetSalary: totalNet,
      totalPaidAmount: totalPaid,
      pendingAmount: totalNet - totalPaid,
    };
  }, [payrollItems]);

  const columns = [
    {
      title: "Bảng lương",
      dataIndex: "payrollName",
      key: "payrollName",
      render: (name: string, record: PayrollItemResponse) => (
        <div>
          <Text strong>{name || "N/A"}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.payrollStartDate && record.payrollEndDate
              ? `${dayjs(record.payrollStartDate).format("DD/MM/YYYY")} - ${dayjs(record.payrollEndDate).format("DD/MM/YYYY")}`
              : ""}
          </Text>
        </div>
      ),
    },
    {
      title: "Lương thực nhận",
      dataIndex: "netSalary",
      key: "netSalary",
      align: "right" as const,
      render: (value: number) => (
        <Text strong style={{ color: "#1890ff" }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Đã thanh toán",
      dataIndex: "paidAmount",
      key: "paidAmount",
      align: "right" as const,
      render: (value: number) => (
        <Text style={{ color: "#52c41a" }}>{formatCurrency(value)}</Text>
      ),
    },
    {
      title: "Còn lại",
      key: "remaining",
      align: "right" as const,
      render: (_: any, record: PayrollItemResponse) => {
        const remaining = (record.netSalary || 0) - (record.paidAmount || 0);
        return (
          <Text style={{ color: remaining > 0 ? "#fa8c16" : "#52c41a" }}>
            {formatCurrency(remaining)}
          </Text>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: (status: string) => {
        const statusInfo = statusMap[status] || { color: "default", text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (note: string) => <Text type="secondary">{note || "-"}</Text>,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Tổng lương"
              value={totalNetSalary}
              precision={0}
              prefix={<DollarOutlined />}
              suffix="₫"
              valueStyle={{ color: "#1890ff" }}
              formatter={(value) => new Intl.NumberFormat("vi-VN").format(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Đã nhận"
              value={totalPaidAmount}
              precision={0}
              prefix={<CheckCircleOutlined />}
              suffix="₫"
              valueStyle={{ color: "#52c41a" }}
              formatter={(value) => new Intl.NumberFormat("vi-VN").format(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Chờ thanh toán"
              value={pendingAmount}
              precision={0}
              prefix={<ClockCircleOutlined />}
              suffix="₫"
              valueStyle={{ color: pendingAmount > 0 ? "#fa8c16" : "#52c41a" }}
              formatter={(value) => new Intl.NumberFormat("vi-VN").format(Number(value))}
            />
          </Card>
        </Col>
      </Row>

      {/* Payroll Items Table */}
      {payrollItems.length > 0 ? (
        <Table
          columns={columns}
          dataSource={payrollItems}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} phiếu lương`,
          }}
          size="middle"
        />
      ) : (
        <Empty description="Chưa có thông tin bảng lương" style={{ marginTop: 40 }} />
      )}
    </div>
  );
};

export default SalaryTab;
