"use client";

import dynamic from "next/dynamic";
import React, { Suspense } from "react";
import { Breadcrumb, Spin } from "antd";

const WorkScheduleTable = dynamic(() => import("@/components/quanlysancaulong/work-schedule/work-schedule-table"), {
  ssr: false,
  loading: () => <Spin />,
});

export default React.memo(function WorkSchedulePage() {
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[{ title: "Quản lý sân cầu lông" }, { title: "Lịch làm việc" }]} />
      </div>
      <Suspense fallback={<Spin />}>
        <WorkScheduleTable />
      </Suspense>
    </>
  );
});
