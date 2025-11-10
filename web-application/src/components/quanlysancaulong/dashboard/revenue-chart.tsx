"use client";

import React from "react";
import { Card } from "antd";

interface Props {
  series?: Array<{ date: string; revenue: number; profit?: number }>;
}

// Small SVG line chart with axes and simple ticks
const RevenueChart: React.FC<Props> = ({ series = [] }) => {
  // hover state for interactivity: highlight one month and dim others
  // NOTE: hooks must be called unconditionally, so declare state before any early returns
  const [hovered, setHovered] = React.useState<number | null>(null);

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
  // compute domain using actual min/max so the lowest value is the true negative minimum
  const rawMax = Math.max(...allValues, 0);
  const rawMin = Math.min(...allValues, 0);
  // ensure a non-zero range, then round max up and min down to millions for cleaner axis
  let max = Math.max(rawMax, 1);
  let min = Math.min(rawMin, -1);
  // round to nearest millions (max up, min down)
  max = Math.ceil(max / 1000000) * 1000000;
  min = Math.floor(min / 1000000) * 1000000;
  if (max === min) {
    // degenerate case: expand range slightly by one million
    max = max + 1000000;
    min = min - 1000000;
  }
  // For bar charts we divide the inner width into N slots (one per category)
  const displayCount = Math.max(12, series.length); // ensure at least 12 slots
  // build an adjusted series padded evenly left/right with empty zeros when needed (center data)
  const pad = displayCount - series.length;
  const padLeft = Math.floor(pad / 2);
  const padRight = pad - padLeft;
  const adjustedSeries = Array.from({ length: padLeft }, () => ({ date: "", revenue: 0, profit: 0 }))
    .concat(series as any)
    .concat(Array.from({ length: padRight }, () => ({ date: "", revenue: 0, profit: 0 })));

  // SVG layout - make width scale with number of slots so bars don't cluster and space looks balanced
  const width = Math.max(600, displayCount * 60); // logical width in user units
  const height = 200;
  // tighten margins to reduce empty space, especially left margin
  // increase bottom margin to make room for rotated x labels
  const margin = { top: 8, right: 16, bottom: 64, left: 36 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const xStep = innerW / displayCount;
  // group width and per-bar width for grouped bars (two bars per group)
  // make the group's total width a smaller fraction of xStep so there's a larger gap between months
  const groupWidth = xStep * 0.5; // half of slot reserved for the two bars, leaving bigger inter-month gap
  const barWidth = Math.max(8, (groupWidth / 2) * 0.9);

  // y ticks: generate a small number of ticks between min and max
  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, idx) => {
    const t = idx / (tickCount - 1);
    const value = min + t * (max - min);
    const norm = (value - min) / (max - min);
    const y = margin.top + innerH - norm * innerH;
    return { y, value };
  });

  // x ticks - render a tick for every adjusted slot so full months are shown (empty padded slots render blank)
  const labelPositions = adjustedSeries.map((_, i) => i);
  const tickIndices = labelPositions; // show all positions (usually 12)
  const xTicks = tickIndices.map((i) => ({ i, label: adjustedSeries[i]?.date ?? "" }));


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
                {/* display values in millions (divide by 1,000,000) to drop last 6 digits */}
                {Math.round(t.value / 1000000).toLocaleString()}
              </text>
            </g>
          ))}

          {/* Y axis label: indicate units are millions */}
          <text
            x={margin.left - 48}
            y={margin.top + innerH / 2}
            fontSize={12}
            fill="#666"
            textAnchor="middle"
            transform={`rotate(-90 ${margin.left - 48} ${margin.top + innerH / 2})`}
          >
            Tiền (triệu)
          </text>

          {/* zero baseline (render only if zero is inside domain) */}
          {min <= 0 && max >= 0
            ? (() => {
                const norm0 = (0 - min) / (max - min);
                const yZeroPos = margin.top + innerH - norm0 * innerH;
                return <line x1={margin.left} y1={yZeroPos} x2={margin.left + innerW} y2={yZeroPos} stroke="#999" strokeDasharray="4 4" />;
              })()
            : null}

          {/* x ticks and labels */}
          {xTicks.map((t, idx) => {
            const x = margin.left + (t.i + 0.5) * xStep;
            return (
              <g key={idx} transform={`translate(${x}, ${margin.top + innerH})`}>
                <line x1={0} x2={0} y1={0} y2={6} stroke="#e8e8e8" />
                {t.label ? (
                  <text x={0} y={20} fontSize={11} textAnchor="middle" fill="#666" transform={`rotate(-45 0 20)`}>
                    {t.label}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* grouped bars: revenue & profit */}
          {(() => {
            const yZero = min <= 0 && max >= 0 ? margin.top + innerH - ((0 - min) / (max - min)) * innerH : yTicks[Math.floor(yTicks.length / 2)].y;
            // spacing between the two bars inside a group (small)
            const spacingBetween = Math.max(4, barWidth * 0.18);
            const totalBarsWidth = 2 * barWidth + spacingBetween;

            return (
              <g>
                {adjustedSeries.map((s, i) => {
                  const groupOpacity = hovered === null ? 1 : hovered === i ? 1 : 0.18;
                  const xCenter = margin.left + (i + 0.5) * xStep;

                  // revenue bar
                  const rev = s.revenue ?? 0;
                  const revYVal = margin.top + innerH - ((rev - min) / Math.max(1, max - min)) * innerH;
                  const revHeight = Math.max(0.5, Math.abs(yZero - revYVal));
                  const revY = Math.min(yZero, revYVal);

                  // profit bar
                  const pf = s.profit ?? 0;
                  const pfYVal = margin.top + innerH - ((pf - min) / Math.max(1, max - min)) * innerH;
                  const pfHeight = Math.max(0.5, Math.abs(yZero - pfYVal));
                  const pfY = Math.min(yZero, pfYVal);

                  const groupLeft = xCenter - totalBarsWidth / 2;
                  const revX = groupLeft;
                  const pfX = groupLeft + barWidth + spacingBetween;

                  return (
                    <g
                      key={`grp-${i}`}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      style={{ cursor: "pointer" }}
                      opacity={groupOpacity}
                    >
                      <rect x={revX} y={revY} width={barWidth} height={revHeight} fill="#1890ff" opacity={0.95} />
                      <rect x={pfX} y={pfY} width={barWidth} height={pfHeight} fill="#52c41a" opacity={0.95} />
                    </g>
                  );
                })}
                {/* tooltip for hovered month */}
                {hovered !== null &&
                  adjustedSeries[hovered] &&
                  (() => {
                    const s = adjustedSeries[hovered];
                    const tx = margin.left + (hovered + 0.5) * xStep;
                    const ty = margin.top + 6;
                    const rev = s.revenue ?? 0;
                    const pf = s.profit ?? 0;
                    const lines = [
                      `${s.date ?? ""}`,
                      `Doanh thu: ${Math.round(rev).toLocaleString()}`,
                      `Lợi nhuận: ${Math.round(pf).toLocaleString()}`,
                    ];
                    const boxWidth = 160;
                    const boxHeight = 18 * lines.length + 8;
                    return (
                      <g transform={`translate(${tx - boxWidth / 2}, ${ty})`}>
                        <rect x={0} y={0} width={boxWidth} height={boxHeight} fill="#fff" stroke="#ddd" rx={6} />
                        {lines.map((line, idx) => (
                          <text key={idx} x={8} y={14 + idx * 18} fontSize={12} fill="#222">
                            {line}
                          </text>
                        ))}
                      </g>
                    );
                  })()}
              </g>
            );
          })()}
        </svg>
        {/* HTML legend below the SVG so it never overlaps bars or labels */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 6, display: "inline-block", background: "#1890ff" }} />
            <span style={{ color: "#333", fontSize: 12 }}>Doanh thu</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 6, display: "inline-block", background: "#52c41a" }} />
            <span style={{ color: "#333", fontSize: 12 }}>Lợi nhuận</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(RevenueChart);
