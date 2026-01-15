"use client";

import { useDashboardHeatmap, useDashboardRecent, useDashboardRevenue, useDashboardSummary, useDashboardTopCourts } from "@/hooks/useDashboard";
import { HeatmapCellDto, RecentTransactionDto, RevenuePointDto, TopCourtDto } from "@/types-openapi/api";
import { Button, Col, Row, Spin } from "antd";
import dynamic from "next/dynamic";
import React, { Suspense } from "react";

const KPIGrid = dynamic(() => import("@/components/quanlysancaulong/dashboard/kpi-grid"), { ssr: false, loading: () => <Spin /> });
const RevenueChart = dynamic(() => import("@/components/quanlysancaulong/dashboard/revenue-chart"), { ssr: false, loading: () => <Spin /> });
const BookingsHeatmap = dynamic(() => import("@/components/quanlysancaulong/dashboard/bookings-heatmap"), { ssr: false, loading: () => <Spin /> });
const TopCourts = dynamic(() => import("@/components/quanlysancaulong/dashboard/top-courts"), { ssr: false, loading: () => <Spin /> });
const RecentAuditLogs = dynamic(() => import("@/components/quanlysancaulong/dashboard/recent-audit-logs"), { ssr: false, loading: () => <Spin /> });

const DashboardPage: React.FC = () => {
  // Real data from backend
  const summaryQ = useDashboardSummary();
  const [granularity, setGranularity] = React.useState<"month" | "quarter">("month");
  const revenueQ = useDashboardRevenue({ granularity });
  const heatmapQ = useDashboardHeatmap();
  const topQ = useDashboardTopCourts();

  // Map DTOs to component props with safe defaults
  const summary = summaryQ.data?.data;
  const kpi = {
    revenue: summary?.totalRevenue ?? 0,
    bookings: summary?.totalBookings ?? 0,
    utilization: summary?.utilizationRate ?? 0,
    customers: summary?.activeCustomers ?? 0,
  };

  const series = (revenueQ.data?.data ?? []) as RevenuePointDto[];
  const chartSeries = series.map((s) => ({
    date: s.label ?? (s.period ? new Date(s.period).toISOString().slice(0, 10) : ""),
    revenue: s.value ?? 0,
    profit: s.profit ?? 0,
  }));

  const heatCells = (heatmapQ.data?.data ?? []) as HeatmapCellDto[];
  const heatMatrix = Array.from({ length: 7 }).map(() => Array.from({ length: 24 }).map(() => 0));
  heatCells.forEach((c) => {
    if (!c) return;
    const dow = (c.dayOfWeek ?? 0) >= 1 && (c.dayOfWeek ?? 0) <= 7 ? (c.dayOfWeek ?? 1) - 1 : (c.dayOfWeek ?? 0);
    const hour = c.hour ?? 0;
    if (dow >= 0 && dow < 7 && hour >= 0 && hour < 24) heatMatrix[dow][hour] = c.bookings ?? 0;
  });

  const topCourts = (topQ.data?.data ?? []) as TopCourtDto[];
  const topItems = topCourts.map((t) => ({ court: t.courtName ?? t.courtId ?? "-", count: t.bookingCount ?? 0 }));

  // Recent transactions with simple pagination (requests limit = page * pageSize)
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(5);

  const recentQ = useDashboardRecent({ limit: page * pageSize });
  const recent = (recentQ.data?.data ?? []) as RecentTransactionDto[];
  // server returns newest-first; slice client-side for page window
  const recentRows = (recent ?? []).slice((page - 1) * pageSize, page * pageSize).map((r) => ({
    id: r.id ?? "",
    date: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 19).replace("T", " ") : "",
    type: r.type ?? "",
    customer: r.customerName ?? "",
    amount: r.amount ?? 0,
  }));

  const hasMore = (recent?.length ?? 0) > page * pageSize;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Bảng điều khiển</h1>

      <Suspense fallback={<Spin />}>
        <KPIGrid revenue={kpi.revenue} bookings={kpi.bookings} utilization={kpi.utilization} customers={kpi.customers} />
      </Suspense>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Suspense fallback={<Spin />}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <Button
                type={granularity === "month" ? "primary" : "default"}
                size="small"
                onClick={() => setGranularity("month")}
                style={{ marginRight: 8 }}
              >
                Tháng
              </Button>
              <Button type={granularity === "quarter" ? "primary" : "default"} size="small" onClick={() => setGranularity("quarter")}>
                Quý
              </Button>
            </div>
            <RevenueChart series={chartSeries} />
          </Suspense>
          <div style={{ marginTop: 16 }}>
            <Suspense fallback={<Spin />}>
              <BookingsHeatmap matrix={heatMatrix} />
            </Suspense>
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <Suspense fallback={<Spin />}>
            <TopCourts items={topItems} />
          </Suspense>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Suspense fallback={<Spin />}>
            <RecentAuditLogs limit={10} />
          </Suspense>
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(DashboardPage);
