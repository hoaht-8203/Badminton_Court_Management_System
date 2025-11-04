"use client";

import dynamic from "next/dynamic";
import React, { useMemo, Suspense } from "react";
import { Row, Col, Spin } from "antd";

const KPIGrid = dynamic(() => import("@/components/quanlysancaulong/dashboard/kpi-grid"), { ssr: false, loading: () => <Spin /> });
const RevenueChart = dynamic(() => import("@/components/quanlysancaulong/dashboard/revenue-chart"), { ssr: false, loading: () => <Spin /> });
const BookingsHeatmap = dynamic(() => import("@/components/quanlysancaulong/dashboard/bookings-heatmap"), { ssr: false, loading: () => <Spin /> });
const TopCourts = dynamic(() => import("@/components/quanlysancaulong/dashboard/top-courts"), { ssr: false, loading: () => <Spin /> });
const RecentTransactions = dynamic(() => import("@/components/quanlysancaulong/dashboard/recent-transactions"), {
  ssr: false,
  loading: () => <Spin />,
});

const DashboardPage: React.FC = () => {
  // mock data for prototype
  const mock = useMemo(() => {
    const series = Array.from({ length: 12 }).map((_, i) => ({
      date: `2025-${String(i + 1).padStart(2, "0")}-01`,
      revenue: Math.round(200000 + Math.random() * 800000),
    }));
    const heat = Array.from({ length: 7 }).map(() => Array.from({ length: 24 }).map(() => Math.floor(Math.random() * 6)));
    const topCourts = Array.from({ length: 5 }).map((_, i) => ({ court: `Sân ${i + 1}`, count: Math.floor(Math.random() * 200) }));
    const recent = Array.from({ length: 6 }).map((_, i) => ({
      id: `CF${1000 + i}`,
      date: `2025-11-${String(i + 1).padStart(2, "0")}`,
      desc: `Giao dịch mẫu ${i + 1}`,
      amount: Math.round(Math.random() * 500000),
    }));
    return { series, heat, topCourts, recent, revenue: series.reduce((s, x) => s + x.revenue, 0), bookings: 324, utilization: 64.2, customers: 215 };
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Bảng điều khiển</h1>

      <Suspense fallback={<Spin />}>
        <KPIGrid revenue={mock.revenue} bookings={mock.bookings} utilization={mock.utilization} customers={mock.customers} />
      </Suspense>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Suspense fallback={<Spin />}>
            <RevenueChart series={mock.series} />
          </Suspense>
          <div style={{ marginTop: 16 }}>
            <Suspense fallback={<Spin />}>
              <BookingsHeatmap matrix={mock.heat} />
            </Suspense>
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <Suspense fallback={<Spin />}>
            <TopCourts items={mock.topCourts} />
          </Suspense>
          <div style={{ marginTop: 16 }}>
            <Suspense fallback={<Spin />}>
              <RecentTransactions data={mock.recent} />
            </Suspense>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(DashboardPage);
