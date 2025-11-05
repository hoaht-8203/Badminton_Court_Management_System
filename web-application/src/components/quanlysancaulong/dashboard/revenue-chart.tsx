"use client";

import React from "react";
import { Card } from "antd";

interface Props {
  series?: Array<{ date: string; revenue: number; profit?: number }>;
}

// Small SVG line chart with axes and simple ticks
const RevenueChart: React.FC<Props> = ({ series = [] }) => {
  if (!series.length) {
    return (
      <Card title="Doanh thu theo thời gian" style={{ minHeight: 240 }}>
        <div>Không có dữ liệu</div>
      </Card>
    );
  }

  const revenueValues = series.map((s) => s.revenue ?? 0);
  const profitValues = series.map((s) => s.profit ?? 0);
  const allValues = [...revenueValues, ...profitValues];
  // compute symmetric domain so that zero is centered
  const rawMax = Math.max(...allValues, 0);
  const rawMin = Math.min(...allValues, 0);
  const maxAbs = Math.max(Math.abs(rawMin), Math.abs(rawMax), 1);
  const max = maxAbs;
  const min = -maxAbs;

  // SVG layout
  const width = 600; // logical width
  const height = 220;
  const margin = { top: 12, right: 12, bottom: 36, left: 56 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const xStep = innerW / Math.max(1, series.length - 1);

  const revenuePoints = series
    .map((s, i) => {
      const x = margin.left + i * xStep;
      const v = s.revenue ?? 0;
      const y = margin.top + innerH - ((v - min) / Math.max(1, max - min)) * innerH;
      return `${x},${y}`;
    })
    .join(" ");

  const profitPoints = series
    .map((s, i) => {
      const x = margin.left + i * xStep;
      const v = s.profit ?? 0;
      const y = margin.top + innerH - ((v - min) / Math.max(1, max - min)) * innerH;
      return `${x},${y}`;
    })
    .join(" ");

  // y ticks: symmetric around zero (5 ticks)
  const yTicks = [ -1, -0.5, 0, 0.5, 1 ].map((t) => {
    const value = t * max;
    // t in [-1,1] -> position within domain
    const norm = (value - min) / (max - min); // 0..1
    const y = margin.top + innerH - norm * innerH;
    return { y, value };
  });

  // x ticks - show up to 6 ticks spaced
  const maxXTicks = 6;
  const step = Math.max(1, Math.floor((series.length - 1) / (maxXTicks - 1)));
  const xTicks = series.map((s, i) => ({ i, label: s.date })).filter((_, idx) => idx % step === 0 || idx === series.length - 1);

  return (
    <Card title="Doanh thu theo thời gian" style={{ minHeight: 240 }}>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}>
          {/* axis lines */}
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + innerH} stroke="#e8e8e8" />
          <line x1={margin.left} y1={margin.top + innerH} x2={margin.left + innerW} y2={margin.top + innerH} stroke="#e8e8e8" />

          {/* y ticks and labels */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line x1={margin.left - 6} x2={margin.left} y1={t.y} y2={t.y} stroke="#e8e8e8" />
              <text x={margin.left - 10} y={t.y + 4} fontSize={11} textAnchor="end" fill="#666">
                {t.value === 0 ? "0" : Math.round(t.value).toLocaleString()}
              </text>
            </g>
          ))}

          {/* zero baseline */}
          <line x1={margin.left} y1={yTicks.find((t) => t.value === 0)!.y} x2={margin.left + innerW} y2={yTicks.find((t) => t.value === 0)!.y} stroke="#999" strokeDasharray="4 4" />

          {/* x ticks and labels */}
          {xTicks.map((t, idx) => {
            const x = margin.left + t.i * xStep;
            return (
              <g key={idx} transform={`translate(${x}, ${margin.top + innerH})`}>
                <line x1={0} x2={0} y1={0} y2={6} stroke="#e8e8e8" />
                <text x={0} y={18} fontSize={11} textAnchor="middle" fill="#666">
                  {t.label}
                </text>
              </g>
            );
          })}

          {/* legend */}
          <g transform={`translate(${width - margin.right - 140}, ${margin.top})`}>
            <rect x={0} y={0} width={140} height={30} fill="transparent" />
            <g transform={`translate(8,6)`}> 
              <circle cx={6} cy={6} r={5} fill="#1890ff" />
              <text x={18} y={10} fontSize={12} fill="#333">Doanh thu</text>
            </g>
            <g transform={`translate(80,6)`}>
              <circle cx={6} cy={6} r={5} fill="#52c41a" />
              <text x={18} y={10} fontSize={12} fill="#333">Lợi nhuận</text>
            </g>
          </g>

          {/* revenue and profit lines */}
          <polyline fill="none" stroke="#1890ff" strokeWidth={2} points={revenuePoints} />
          <polyline fill="none" stroke="#52c41a" strokeWidth={2} points={profitPoints} />

          {/* markers for revenue */}
          {series.map((s, i) => {
            const x = margin.left + i * xStep;
            const v = s.revenue ?? 0;
            const y = margin.top + innerH - ((v - min) / Math.max(1, max - min)) * innerH;
            return <circle key={`r-${i}`} cx={x} cy={y} r={3} fill="#1890ff" />;
          })}

          {/* markers for profit */}
          {series.map((s, i) => {
            const x = margin.left + i * xStep;
            const v = s.profit ?? 0;
            const y = margin.top + innerH - ((v - min) / Math.max(1, max - min)) * innerH;
            return <circle key={`p-${i}`} cx={x} cy={y} r={3} fill="#52c41a" />;
          })}
        </svg>
      </div>
    </Card>
  );
};

export default React.memo(RevenueChart);
