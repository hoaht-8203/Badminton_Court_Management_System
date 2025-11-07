"use client";

import React from "react";
import { Card, Row, Col, Statistic } from "antd";
import { DollarSign, Calendar, Users, BarChart2 } from "lucide-react";

interface KPIProps {
  revenue: number;
  bookings: number;
  utilization: number;
  customers: number;
}

const cardStyles: Record<string, React.CSSProperties> = {
  revenue: { background: "linear-gradient(90deg,#e6f7ff,#ffffff)", borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.04)" },
  bookings: { background: "linear-gradient(90deg,#fff7e6,#ffffff)", borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.04)" },
  utilization: { background: "linear-gradient(90deg,#f6fff0,#ffffff)", borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.04)" },
  customers: { background: "linear-gradient(90deg,#fff0f6,#ffffff)", borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.04)" },
};

// Slightly larger icon offset and card minimum height for better spacing
const iconStyle: React.CSSProperties = { position: "absolute", top: 16, right: 16, opacity: 0.14 };

const KPIGrid: React.FC<KPIProps> = ({ revenue, bookings, utilization, customers }) => {
  return (
    <Row gutter={16}>
      <Col xs={24} sm={12} md={6}>
        <Card
          style={cardStyles.revenue}
          styles={{
            body: { position: "relative", padding: 20, minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "space-between" },
          }}
        >
          <div style={iconStyle}>
            <DollarSign size={36} />
          </div>
          <Statistic
            title={<span style={{ fontWeight: 700, fontSize: 16, color: "#2b2b2b" }}>Tổng doanh thu</span>}
            value={revenue}
            precision={0}
            formatter={(value) => (Number(value) || 0).toLocaleString()}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card
          style={cardStyles.bookings}
          styles={{
            body: { position: "relative", padding: 20, minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "space-between" },
          }}
        >
          <div style={iconStyle}>
            <Calendar size={36} />
          </div>
          <Statistic title={<span style={{ fontWeight: 700, fontSize: 16, color: "#2b2b2b" }}>Số lượt đặt</span>} value={bookings} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card
          style={cardStyles.utilization}
          styles={{
            body: { position: "relative", padding: 20, minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "space-between" },
          }}
        >
          <div style={iconStyle}>
            <BarChart2 size={36} />
          </div>
          <Statistic
            title={<span style={{ fontWeight: 700, fontSize: 16, color: "#2b2b2b" }}>Tỷ lệ lấp đầy</span>}
            value={Math.round(utilization)}
            suffix="%"
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card
          style={cardStyles.customers}
          styles={{
            body: { position: "relative", padding: 20, minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "space-between" },
          }}
        >
          <div style={iconStyle}>
            <Users size={36} />
          </div>
          <Statistic title={<span style={{ fontWeight: 700, fontSize: 16, color: "#2b2b2b" }}>Khách hàng</span>} value={customers} />
        </Card>
      </Col>
    </Row>
  );
};

export default React.memo(KPIGrid);
