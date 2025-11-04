"use client";

import React from "react";
import { Card } from "antd";

interface Props {
  matrix?: number[][]; // 7 x 24 matrix of bookings counts
}

const BookingsHeatmap: React.FC<Props> = ({ matrix = [] }) => {
  const rows = matrix.length ? matrix : Array.from({ length: 7 }).map(() => Array.from({ length: 24 }).map(() => 0));

  return (
    <Card title="Heatmap lượt đặt (ngày x giờ)" style={{ minHeight: 220 }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${rows[0].length}, 24px)`, gap: 2 }}>
          {rows
            .flatMap((r) => r)
            .map((v, i) => {
              const c = Math.min(255, 30 + v * 10);
              return <div key={i} style={{ width: 24, height: 18, background: `rgb(${255 - c}, ${255 - c}, ${255 - Math.floor(c / 2)})` }} />;
            })}
        </div>
      </div>
    </Card>
  );
};

export default React.memo(BookingsHeatmap);
