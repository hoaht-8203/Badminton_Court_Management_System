"use client";

import React from "react";
import { Card, Row, Col, Statistic } from "antd";

interface KPIProps {
  revenue: number;
  bookings: number;
  utilization: number;
  customers: number;
}

const KPIGrid: React.FC<KPIProps> = ({ revenue, bookings, utilization, customers }) => {
  return (
    <Row gutter={16}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic title="Tổng doanh thu" value={revenue.toLocaleString()} precision={0} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic title="Số lượt đặt" value={bookings} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic title="Tỷ lệ lấp đầy" value={`${Math.round(utilization)}%`} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic title="Khách hàng" value={customers} />
        </Card>
      </Col>
    </Row>
  );
};

export default React.memo(KPIGrid);
