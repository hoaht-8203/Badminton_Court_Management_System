"use client";

import React from "react";
import { Card } from "antd";

interface Props {
  matrix?: number[][]; // 7 x 24 matrix of bookings counts
}

const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const getColor = (v: number, max: number) => {
  const t = max > 0 ? v / max : 0;
  // gradient from #f0f5ff (light) to #003a8c (deep blue)
  const r1 = 240,
    g1 = 245,
    b1 = 255;
  const r2 = 0,
    g2 = 58,
    b2 = 140;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
};

const BookingsHeatmap: React.FC<Props> = ({ matrix = [] }) => {
  const rows = matrix.length ? matrix : Array.from({ length: 7 }).map(() => Array.from({ length: 24 }).map(() => 0));

  // compute max for color scaling
  const max = rows.flat().reduce((m, v) => Math.max(m, v ?? 0), 0);

  return (
    <Card title="Heatmap lượt đặt (ngày x giờ)" style={{ minHeight: 240 }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `60px repeat(${rows[0].length}, 28px)`, gap: 4, alignItems: "center" }}>
          {/* top-left empty */}
          <div />
          {/* hour labels */}
          {Array.from({ length: rows[0].length }).map((_, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 11, color: "#666" }}>
              {i}
            </div>
          ))}

          {/* rows with day label + cells */}
          {rows.map((row, rIdx) => (
            <React.Fragment key={rIdx}>
              <div style={{ paddingRight: 8, textAlign: "right", fontSize: 12, color: "#333" }}>{dayLabels[rIdx] ?? rIdx}</div>
              {row.map((v, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  title={`Ngày ${dayLabels[rIdx] ?? rIdx}, ${cIdx}h — ${v ?? 0} lượt`}
                  style={{ width: 28, height: 18, background: getColor(v ?? 0, max), borderRadius: 3 }}
                />
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Số lượt</div>
          <div style={{ flex: 1 }}>
            <div style={{ height: 10, background: `linear-gradient(90deg, rgb(240,245,255), rgb(0,58,140))`, borderRadius: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", marginTop: 4 }}>
              <div>0</div>
              <div>{max}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(BookingsHeatmap);
