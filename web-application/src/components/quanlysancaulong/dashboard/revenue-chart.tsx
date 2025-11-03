"use client";

import React from "react";
import { Card } from "antd";

interface Props {
  series?: Array<{ date: string; revenue: number }>;
}

// Lightweight mock chart: simple SVG sparkline for prototype purposes
const RevenueChart: React.FC<Props> = ({ series = [] }) => {
  const max = Math.max(...series.map((x) => x.revenue), 1);
  const points = series
    .map((s, i) => `${(i / Math.max(1, series.length - 1)) * 100},${100 - Math.min(100, Math.round((s.revenue / max) * 100))}`)
    .join(" ");

  return (
    <Card title="Doanh thu theo thời gian" style={{ minHeight: 220 }}>
      {series.length === 0 ? (
        <div>Demo data</div>
      ) : (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 140 }}>
          <polyline fill="none" stroke="#1890ff" strokeWidth={2} points={points} />
        </svg>
      )}
    </Card>
  );
};

export default React.memo(RevenueChart);
